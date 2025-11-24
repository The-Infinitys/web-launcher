import { invoke } from "@tauri-apps/api/core";

// AppInfo型を定義 (RustのAppInfo構造体に対応)
export interface AppInfo {
  id: string; // idフィールドを追加
  name: string;
  url: string;
  icon: string | null;
  description: string | null;
}

export async function getFile(path: string): Promise<string> {
  // Support both snake_case and camelCase keys in case Tauri expects a different key name
  return await invoke<string>("get_file", {
    relativePath: path,
  });
}

export async function listDir(
  path: string,
): Promise<Array<{ name: string; type: string }>> {
  // Support both snake_case and camelCase keys in case Tauri expects a different key name
  return await invoke<Array<{ name: string; type: string }>>("list_dir", {
    relativePath: path,
  });
}

export type ExecResult = { stdout: string; stderr: string; code: number };

export async function exec(
  name: string,
  args: string[] = [],
): Promise<ExecResult> {
  return await invoke<ExecResult>("exec", { name, args });
}

export async function ensureDir(path: string): Promise<void> {
  // call the Rust `create_dir` command; support both key variants
  await invoke<void>("create_dir", { relativePath: path });
}
export async function writeFile(path: string, content: string): Promise<void> {
  await invoke<void>("write_file", {
    relativePath: path,
    content: content,
  });
}

// 新しい関数を追加
export async function getAppInfoFromUrl(url: string): Promise<AppInfo> {
  return await invoke<AppInfo>("get_app_info_from_url", { url });
}

// save_app_infoコマンドを呼び出す新しい関数
export async function saveAppInfo(appInfo: AppInfo): Promise<void> {
  return await invoke<void>("save_app_info", { appInfo });
}

// delete_app_dirコマンドを呼び出す新しい関数
export async function deleteAppDir(id: string): Promise<void> {
  return await invoke<void>("delete_app_dir", { id });
}
