use serde::Serialize;
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

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
            exec
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
