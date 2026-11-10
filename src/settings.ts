import type { Category } from "./categories";

export type NavPosition = "left" | "right" | "top" | "bottom";

export type SettingsTab = "general" | "sites" | "categories" | "appearance" | "update" | "about";

export interface Settings {
  showNames: boolean;
  showSearch: boolean;
  showAddTile: boolean;
  tileSize: "sm" | "md" | "lg";
  overlay: "light" | "mid" | "dark";
  navPosition: NavPosition;
  updateUrl: string;
  categories: Category[];
}

const KEY = "workbench-settings";

// 打包前改成公司服务器的 latest.json 地址，客户端首次启动即可自动检查更新
export const DEFAULT_UPDATE_URL = "";

export const defaultSettings: Settings = {
  showNames: true,
  showSearch: true,
  showAddTile: true,
  tileSize: "md",
  overlay: "mid",
  navPosition: "left",
  updateUrl: DEFAULT_UPDATE_URL,
  categories: [],
};

export function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return { ...defaultSettings, categories: [] };
    const merged = { ...defaultSettings, ...(JSON.parse(raw) as Partial<Settings>) };
    if (!merged.updateUrl) merged.updateUrl = DEFAULT_UPDATE_URL;
    if (!Array.isArray(merged.categories)) merged.categories = [];
    if (!["left", "right", "top", "bottom"].includes(merged.navPosition)) merged.navPosition = "left";
    return merged;
  } catch {
    return { ...defaultSettings, categories: [] };
  }
}

export function saveSettings(s: Settings) {
  localStorage.setItem(KEY, JSON.stringify(s));
}
