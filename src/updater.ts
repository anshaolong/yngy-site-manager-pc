import { invoke } from "@tauri-apps/api/core";
import { getVersion } from "@tauri-apps/api/app";
import { relaunch } from "@tauri-apps/plugin-process";
import { isTauri } from "./api";

export interface UpdateInfo {
  version: string;
  body: string | null;
  date: string | null;
}

export async function currentVersion(): Promise<string> {
  if (!isTauri) return "0.1.0";
  try {
    return await getVersion();
  } catch {
    return "-";
  }
}

export async function checkUpdate(endpoint: string): Promise<UpdateInfo | null> {
  if (!isTauri) throw new Error("浏览器模式无法检查更新，请在桌面应用中使用");
  const url = endpoint.trim();
  if (!url) throw new Error("请先填写更新地址");
  return invoke<UpdateInfo | null>("check_update", { endpoint: url });
}

export async function installUpdate(endpoint: string, onProgress?: (msg: string) => void): Promise<void> {
  onProgress?.("正在下载并安装更新…");
  await invoke("install_update", { endpoint: endpoint.trim() });
  onProgress?.("安装完成，正在重启…");
  await relaunch();
}
