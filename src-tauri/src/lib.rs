use reqwest::Url;
use scraper::{Html, Selector};
use serde::{Deserialize, Serialize};
use sha2::{Digest, Sha256};
use std::fs;
use std::io::copy;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

// アプリケーション情報を格納するための構造体
#[derive(Debug, Serialize, Deserialize, Clone)] // Cloneトレイトを追加
pub struct AppInfo {
    pub id: String,
    pub name: String,
    pub url: String,
    pub icon: Option<String>, // URLまたはローカルパス
    pub description: Option<String>,
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

// ⬇️ 修正後の get_app_info_from_url コマンド ⬇️
#[tauri::command]
async fn get_app_info_from_url(url: String) -> Result<AppInfo, String> {
    let parsed_url = Url::parse(&url).map_err(|e| format!("Invalid URL: {}", e))?;

    // URLからIDを生成 (SHA256ハッシュ)
    let mut hasher = Sha256::new();
    hasher.update(&url);
    let id = format!("{:x}", hasher.finalize());

    let client = reqwest::Client::new();
    let res = client
        .get(&url)
        .send()
        .await
        .map_err(|e| format!("Failed to fetch URL: {}", e))?;
    // body は非同期タスク内で複数回使用されるため、ここでは String のまま保持
    let body = res
        .text()
        .await
        .map_err(|e| format!("Failed to read response body: {}", e))?;

    // 1. HTMLパース (scraper::Html) - ページ情報取得
    // body と parsed_url のクローンを作成し、ブロッキングタスクにムーブする
    let (app_name, app_icon, app_description) = tokio::task::spawn_blocking({
        let parsed_url = parsed_url.clone();
        let body_clone_1 = body.clone(); // 1回目のパース用
        move || {
            let document = Html::parse_document(&body_clone_1);
            let mut app_name = "Unknown App".to_string();
            let mut app_icon: Option<String> = None;
            let mut app_description: Option<String> = None;

            // ... (名前、アイコン、説明の抽出ロジックは省略せずに実行) ...

            // 1. 名前 (Title)
            let title_selector = Selector::parse("title").unwrap();
            if let Some(title_element) = document.select(&title_selector).next() {
                app_name = title_element.text().collect::<String>().trim().to_string();
            }

            // 2. アイコン
            let icon_selector = Selector::parse(
                "link[rel='icon'], link[rel='shortcut icon'], link[rel='apple-touch-icon']",
            )
            .unwrap();
            for link_element in document.select(&icon_selector) {
                if let Some(href) = link_element.value().attr("href") {
                    if let Ok(icon_absolute_url) = parsed_url.join(href) {
                        app_icon = Some(icon_absolute_url.to_string());
                        break;
                    }
                }
            }

            // 3. 説明 (Meta description)
            let meta_description_selector = Selector::parse("meta[name='description']").unwrap();
            if let Some(meta_element) = document.select(&meta_description_selector).next() {
                if let Some(content) = meta_element.value().attr("content") {
                    app_description = Some(content.to_string());
                }
            }

            (app_name, app_icon, app_description)
        }
    })
    .await
    .map_err(|e| format!("Failed to run blocking task (info extraction): {}", e))?;

    // 2. HTMLパース (scraper::Html) - マニフェストURL取得
    // body の新しいクローンと parsed_url のクローンを作成し、ブロッキングタスクにムーブする
    let manifest_url_result: Result<Option<Url>, String> = tokio::task::spawn_blocking({
        let parsed_url = parsed_url.clone();
        let body_clone_2 = body.clone(); // 2回目のパース用
        move || {
            let document = Html::parse_document(&body_clone_2);
            let manifest_selector = Selector::parse("link[rel='manifest']").unwrap();

            if let Some(manifest_element) = document.select(&manifest_selector).next() {
                if let Some(href) = manifest_element.value().attr("href") {
                    if let Ok(url) = parsed_url.join(href) {
                        return Ok(Some(url));
                    }
                }
            }
            Ok(None)
        }
    })
    .await
    .map_err(|e| {
        format!(
            "Failed to run blocking task (manifest URL extraction): {}",
            e
        )
    })?;

    let manifest_absolute_url = manifest_url_result?;

    // 3. マニフェストJSONの取得と解析 (非同期処理)
    let mut final_app_name = app_name;
    let mut final_app_icon = app_icon;
    let mut final_app_description = app_description;

    if let Some(manifest_url) = manifest_absolute_url {
        let manifest_res = client
            .get(manifest_url.as_str())
            .send()
            .await
            .map_err(|e| format!("Failed to fetch manifest: {}", e))?;
        let manifest_json: WebManifest = manifest_res
            .json()
            .await
            .map_err(|e| format!("Failed to parse manifest JSON: {}", e))?;

        if let Some(name) = manifest_json.name.or(manifest_json.short_name) {
            final_app_name = name;
        }
        if let Some(description) = manifest_json.description {
            final_app_description = Some(description);
        }
        if let Some(icons) = manifest_json.icons {
            if let Some(best_icon) = icons.iter().max_by_key(|icon| {
                icon.sizes
                    .as_ref()
                    .and_then(|s| s.split('x').next()?.parse::<u32>().ok())
                    .unwrap_or(0)
            }) {
                if let Ok(icon_url_from_manifest) = manifest_url.join(&best_icon.src) {
                    final_app_icon = Some(icon_url_from_manifest.to_string());
                }
            }
        }
    }

    Ok(AppInfo {
        id, // 生成したIDを設定
        name: final_app_name,
        url: url,
        icon: final_app_icon,
        description: final_app_description,
    })
}

// アプリケーション情報をファイルに保存する新しいTauriコマンド
#[tauri::command]
async fn save_app_info(app_handle: AppHandle, app_info: AppInfo) -> Result<(), String> {
    let base_dir = get_base_dir(app_handle.clone())?;
    let app_dir = base_dir.join("apps").join(&app_info.id);
    let file_path = app_dir.join("application.json");

    // ディレクトリが存在しない場合は作成
    fs::create_dir_all(&app_dir)
        .map_err(|e| format!("Failed to create directory {}: {}", app_dir.display(), e))?;

    // AppInfoをJSON文字列にシリアライズ
    let json_content = serde_json::to_string_pretty(&app_info)
        .map_err(|e| format!("Failed to serialize AppInfo to JSON: {}", e))?;

    // ファイルに書き込む (既存のwrite_file関数を再利用)
    write_file(
        app_handle,
        file_path
            .strip_prefix(&base_dir)
            .map_err(|e| format!("Failed to strip prefix from path: {}", e))?
            .to_string_lossy()
            .into_owned(),
        json_content,
    )
}

// アプリケーションディレクトリを削除する新しいTauriコマンド
#[tauri::command]
async fn delete_app_dir(app_handle: AppHandle, id: String) -> Result<(), String> {
    let base_dir = get_base_dir(app_handle.clone())?;
    let app_dir = base_dir.join("apps").join(&id);

    if app_dir.exists() {
        fs::remove_dir_all(&app_dir)
            .map_err(|e| format!("Failed to delete directory {}: {}", app_dir.display(), e))?;
    } else {
        return Err(format!(
            "Application directory not found: {}",
            app_dir.display()
        ));
    }
    Ok(())
}

// ローカルのアイコンファイルをアプリのデータディレクトリに保存する
// app_idとsource_path (ユーザーが選択したファイルのパス) を引数に取る
#[tauri::command]
async fn save_local_icon(
    app_handle: AppHandle,
    app_id: String,
    source_path: String,
) -> Result<String, String> {
    let app_data_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| format!("Failed to get app data directory: {}", e))?;

    let app_icon_dir = app_data_dir.join("app_icons").join(&app_id);
    fs::create_dir_all(&app_icon_dir).map_err(|e| {
        format!(
            "Failed to create icon directory {}: {}",
            app_icon_dir.display(),
            e
        )
    })?;

    let source_file_name = PathBuf::from(&source_path)
        .file_name()
        .ok_or_else(|| "Invalid source path: cannot get file name".to_string())?
        .to_string_lossy()
        .into_owned();

    let destination_path = app_icon_dir.join(&source_file_name);

    let mut source_file = fs::File::open(&source_path)
        .map_err(|e| format!("Failed to open source icon file {}: {}", source_path, e))?;
    let mut destination_file = fs::File::create(&destination_path).map_err(|e| {
        format!(
            "Failed to create destination icon file {}: {}",
            destination_path.display(),
            e
        )
    })?;

    copy(&mut source_file, &mut destination_file)
        .map_err(|e| format!("Failed to copy icon file: {}", e))?;

    // Tauriのカスタムプロトコル (`tauri://localhost/`) を使用して、Webviewからアクセス可能なパスを返す
    // `app_data_dir`からの相対パスを構築し、それを `tauri://localhost/__tauri_assets__/` にプレフィックスとして追加
    let relative_path = destination_path
        .strip_prefix(&app_data_dir)
        .map_err(|e| format!("Failed to get relative path for icon: {}", e))?
        .to_string_lossy()
        .into_owned();

    // Tauri 2では、`__tauri_assets__`プロトコルを使用して`app_data_dir`にアクセスできるため、そのパスを構築して返す。
    // https://tauri.app/v2/guides/features/asset-protocol/
    Ok(format!(
        "tauri://localhost/__tauri_assets__/{}",
        relative_path
    ))
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
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        // 新しいコマンドを登録
        .invoke_handler(tauri::generate_handler![
            get_web_launcher_dir,
            list_dir,
            get_file,
            create_dir,
            write_file,
            exec,
            get_app_info_from_url,
            save_app_info,
            delete_app_dir,
            save_local_icon // 新しいコマンドを登録
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
