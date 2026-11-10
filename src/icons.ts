// 从 Iconify（icones.js.org 的图标库）按需加载图标
// 名称格式为 "集合:图标"，例如 mdi:home、lucide:rocket、tabler:briefcase

const API = "https://api.iconify.design";
const CACHE_PREFIX = "icon-svg:";
const memory = new Map<string, string>();

export function isIconify(name: string): boolean {
  return /^[a-z0-9-]+:[a-z0-9-]+$/i.test(name.trim());
}

export function iconUrl(name: string): string {
  const [prefix, icon] = name.trim().split(":");
  return `${API}/${prefix}/${icon}.svg`;
}

export function previewUrl(name: string): string {
  return `${iconUrl(name)}?color=%23ffffff&height=18`;
}

export async function loadIconSvg(name: string): Promise<string> {
  if (!isIconify(name)) return "";
  const key = name.trim();
  const hit = memory.get(key);
  if (hit) return hit;

  try {
    const cached = localStorage.getItem(CACHE_PREFIX + key);
    if (cached) {
      memory.set(key, cached);
      return cached;
    }
  } catch {
    // localStorage 不可用时忽略
  }

  const res = await fetch(iconUrl(key));
  if (!res.ok) throw new Error(`图标不存在：${key}`);
  const svg = await res.text();
  memory.set(key, svg);
  try {
    localStorage.setItem(CACHE_PREFIX + key, svg);
  } catch {
    // 缓存写入失败不影响显示
  }
  return svg;
}

export async function searchIcons(query: string, limit = 40): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  const res = await fetch(`${API}/search?query=${encodeURIComponent(q)}&limit=${limit}`);
  if (!res.ok) return [];
  const data = (await res.json()) as { icons?: string[] };
  return data.icons ?? [];
}

// ---- 文字图标：letter:字|#颜色 ----

export const ICON_COLORS = [
  "#2f6bff",
  "#7c3aed",
  "#0891b2",
  "#059669",
  "#d97706",
  "#dc2626",
  "#db2777",
  "#64748b",
];

const LETTER_PREFIX = "letter:";

export function letterIcon(text: string, color: string): string {
  return `${LETTER_PREFIX}${text}${color ? `|${color}` : ""}`;
}

export function parseLetterIcon(icon: string): { text: string; color: string } | null {
  if (!icon.startsWith(LETTER_PREFIX)) return null;
  const [text, color] = icon.slice(LETTER_PREFIX.length).split("|");
  return { text: text.slice(0, 2), color: color || "" };
}

export function colorForName(name: string): string {
  let h = 0;
  for (const c of name) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return ICON_COLORS[h % ICON_COLORS.length];
}
