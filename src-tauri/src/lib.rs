use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use std::collections::HashMap;
use reqwest::Url;
use scraper::{Html, Selector};

// アプリケーション情報を格納するための構造体
#[derive(Debug, Serialize, Deserialize)]
pub struct AppInfo {
    name: String,
    url: String,
    icon: Option<String>, // URL
    description: Option<String>,
}

// PWAマニフェストの構造体（必要な部分のみ）
#[derive(Debug, Serialize, Deserialize)]
struct WebManifest {
    name: Option<String>,
    short_name: Option<String>,
    description: Option<String>,
    icons: Option<Vec<ManifestIcon>>,
    start_url: Option<String>,
    display: Option<String>,
    theme_color: Option<String>,
    background_color: Option<String>,
}

#[derive(Debug, Serialize, Deserialize)]
struct ManifestIcon {
    src: String,
    sizes: Option<String>,
    #[serde(rename = "type")]
    icon_type: Option<String>,
    purpose: Option<String>,
}

// 新しいTauriコマンドを定義
#[tauri::command]
fn get_web_launcher_dir(app_handle: tauri::AppHandle) -> Result<String, String> {
    match app_handle.path().home_dir() {
        Ok(mut home_dir) => {
            home_dir.push(".web-launcher");
            // パスを文字列に変換して返す
            Ok(home_dir.to_string_lossy().into_owned())
        }
        Err(e) => Err(format!("Failed to get home directory: {}", e)),
    }
}

#[derive(Serialize)]
enum EntryType {
    File,
    Directory,
    Symlink,
    Unknown,
}

#[derive(Serialize)]
struct DirEntryInfo {
    name: String,
    #[serde(rename = "type")]
    entry_type: EntryType,
}

fn get_base_dir(app_handle: AppHandle) -> Result<PathBuf, String> {
    let mut home_dir = app_handle
        .path()
        .home_dir()
        .map_err(|e| format!("Failed to get home directory: {}", e))?;
    home_dir.push(".web-launcher");
    Ok(home_dir)
}

#[tauri::command]
fn list_dir(app_handle: AppHandle, relative_path: String) -> Result<Vec<DirEntryInfo>, String> {
    let base_dir = get_base_dir(app_handle)?;
    let target_path = base_dir.join(&relative_path);

    if !target_path.exists() {
        return Err(format!("Path does not exist: {}", target_path.display()));
    }
    if !target_path.is_dir() {
        return Err(format!(
            "Path is not a directory: {}",
            target_path.display()
        ));
    }

    let mut entries_info = Vec::new();
    for entry in
        fs::read_dir(target_path).map_err(|e| format!("Failed to read directory: {}", e))?
    {
        let entry = entry.map_err(|e| format!("Failed to read directory entry: {}", e))?;
        let file_name = entry.file_name().to_string_lossy().into_owned();
        let file_type = entry
            .file_type()
            .map_err(|e| format!("Failed to get file type: {}", e))?;

        let entry_type = if file_type.is_file() {
            EntryType::File
        } else if file_type.is_dir() {
            EntryType::Directory
        } else if file_type.is_symlink() {
            EntryType::Symlink
        } else {
            EntryType::Unknown
        };

        entries_info.push(DirEntryInfo {
            name: file_name,
            entry_type,
        });
    }
    Ok(entries_info)
}
#[tauri::command]
fn exec(name: String, args: Vec<String>) -> Result<ExecResult, String> {
    use std::process::Command;

    let output = Command::new(&name)
        .args(&args)
        .output()
        .map_err(|e| format!("failed to spawn process '{}': {}", name, e))?;

    let stdout = String::from_utf8_lossy(&output.stdout).to_string();
    let stderr = String::from_utf8_lossy(&output.stderr).to_string();
    let code = output.status.code().unwrap_or(-1);

    Ok(ExecResult {
        stdout,
        stderr,
        code,
    })
}

#[derive(Serialize)]
struct ExecResult {
    stdout: String,
    stderr: String,
    code: i32,
}
#[tauri::command]
fn get_file(app_handle: AppHandle, relative_path: String) -> Result<String, String> {
    let base_dir = get_base_dir(app_handle)?;
    let target_path = base_dir.join(&relative_path);

    if !target_path.exists() {
        return Err(format!("File does not exist: {}", target_path.display()));
    }
    if !target_path.is_file() {
        return Err(format!("Path is not a file: {}", target_path.display()));
    }

    fs::read_to_string(target_path).map_err(|e| format!("Failed to read file: {}", e))
}

#[tauri::command]
fn write_file(app_handle: AppHandle, relative_path: String, content: String) -> Result<(), String> {
    let base_dir = get_base_dir(app_handle)?;
    let target_path = base_dir.join(&relative_path);

    // ファイルが存在するディレクトリを取得
    if let Some(parent_dir) = target_path.parent() {
        // 親ディレクトリが存在しない場合、作成を試みる
        if !parent_dir.exists() {
            fs::create_dir_all(parent_dir).map_err(|e| {
                format!("Failed to create directory {}: {}", parent_dir.display(), e)
            })?;
        }
    }

    fs::write(target_path, content).map_err(|e| format!("Failed to write file: {}", e))?;
    Ok(())
}
#[tauri::command]
fn create_dir(app_handle: AppHandle, relative_path: String) -> Result<(), String> {
    let base_dir = get_base_dir(app_handle)?;
    let target_path = if relative_path.is_empty() {
        base_dir
    } else {
        base_dir.join(&relative_path)
    };

    fs::create_dir_all(&target_path)
        .map_err(|e| format!("Failed to create dir {}: {}", target_path.display(), e))?;
    Ok(())
}

#[tauri::command]
async fn get_app_info_from_url(url: String) -> Result<AppInfo, String> {
    let parsed_url = Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;

    let client = reqwest::Client::new();
    let res = client.get(&url).send().await.map_err(|e| format!("Failed to fetch URL: {}", e))?;
    let body = res.text().await.map_err(|e| format!("Failed to read response body: {}", e))?;

    let document = Html::parse_document(&body);

    // 1. 名前 (Title or Manifest name)
    let mut app_name = "Unknown App".to_string();
    let title_selector = Selector::parse("title").unwrap();
    if let Some(title_element) = document.select(&title_selector).next() {
        app_name = title_element.text().collect::<String>().trim().to_string();
    }

    // 2. アイコン
    let mut app_icon: Option<String> = None;
    let icon_selector = Selector::parse("link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']").unwrap();
    for link_element in document.select(&icon_selector) {
        if let Some(href) = link_element.value().attr("href") {
            // 絶対URLに変換
            if let Ok(icon_absolute_url) = parsed_url.join(href) {
                app_icon = Some(icon_absolute_url.to_string());
                break; // 最初のアイコンを見つけたら終了
            }
        }
    }

    // 3. 説明 (Meta description or Manifest description)
    let mut app_description: Option<String> = None;
    let meta_description_selector = Selector::parse("meta[name='description']").unwrap();
    if let Some(meta_element) = document.select(&meta_description_selector).next() {
        if let Some(content) = meta_element.value().attr("content") {
            app_description = Some(content.to_string());
        }
    }

    // 4. PWAマニフェストの解析
    let manifest_selector = Selector::parse("link[rel='manifest']").unwrap();
    if let Some(manifest_element) = document.select(&manifest_selector).next() {
        if let Some(href) = manifest_element.value().attr("href") {
            if let Ok(manifest_absolute_url) = parsed_url.join(href) {
                let manifest_res = client.get(manifest_absolute_url.as_str()).send().await.map_err(|e| format!("Failed to fetch manifest: {}", e))?;
                let manifest_json: WebManifest = manifest_res.json().await.map_err(|e| format!("Failed to parse manifest JSON: {}", e))?;

                if let Some(name) = manifest_json.name.or(manifest_json.short_name) {
                    app_name = name;
                }
                if let Some(description) = manifest_json.description {
                    app_description = Some(description);
                }
                if let Some(icons) = manifest_json.icons {
                    // 最も適切なアイコン（例えば、最も大きいアイコン）を選択
                    if let Some(best_icon) = icons.iter().max_by_key(|icon| {
                        icon.sizes.as_ref().and_then(|s| {
                            s.split('x').next()?.parse::<u32>().ok()
                        }).unwrap_or(0)
                    }) {
                        if let Ok(icon_url_from_manifest) = manifest_absolute_url.join(&best_icon.src) {
                            app_icon = Some(icon_url_from_manifest.to_string());
                        }
                    }
                }
            }
        }
    }

    Ok(AppInfo {
        name: app_name,
        url: url,
        icon: app_icon,
        description: app_description,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .setup(|app| {
            if cfg!(debug_assertions) {
                app.handle().plugin(
                    tauri_plugin_log::Builder::default()
                        .level(log::LevelFilter::Info)
                        .build(),
                )?;
            }
            Ok(())
        })
        // 新しいコマンドを登録
        .invoke_handler(tauri::generate_handler![
            get_web_launcher_dir,
            list_dir,
            get_file,
            create_dir,
            write_file, // write_fileも登録
            exec,
            get_app_info_from_url // 新しく追加したコマンド
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
