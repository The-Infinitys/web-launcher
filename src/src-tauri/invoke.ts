import { invoke } from "@tauri-apps/api/core";

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
