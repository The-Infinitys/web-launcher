import { invoke } from "@tauri-apps/api/core";

export async function getFile(path: string): Promise<string> {
  // Support both snake_case and camelCase keys in case Tauri expects a different key name
  return await invoke<string>("get_file", {
    relative_path: path,
    relativePath: path,
  });
}

export async function listDir(
  path: string
): Promise<Array<{ name: string; type: string }>> {
  // Support both snake_case and camelCase keys in case Tauri expects a different key name
  return await invoke<Array<{ name: string; type: string }>>("list_dir", {
    relative_path: path,
    relativePath: path,
  });
}
