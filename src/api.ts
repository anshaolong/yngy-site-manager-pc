import { invoke } from "@tauri-apps/api/core";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";

export interface Site {
  id: string;
  name: string;
  url: string;
  category: string;
  description: string;
  icon: string;
}

// 在 Tauri 环境外（纯浏览器调试）降级为 localStorage + window.open
export const isTauri = "__TAURI_INTERNALS__" in window;
const LS_KEY = "company-sites";

function defaultSites(): Site[] {
  const rows: Array<[string, string, string, string, string]> = [
    ["oa", "OA 办公系统", "https://oa.example.com", "办公", "考勤、审批、流程办理"],
    ["mail", "企业邮箱", "https://mail.example.com", "办公", "公司内部邮件收发"],
    ["crm", "CRM 客户管理", "https://crm.example.com", "业务", "客户资料与跟进记录"],
    ["erp", "ERP 系统", "https://erp.example.com", "业务", "订单、库存与采购管理"],
    ["project", "项目管理", "https://project.example.com", "协作", "任务拆解与进度跟踪"],
    ["docs", "知识文档", "https://docs.example.com", "协作", "团队文档与知识库"],
  ];
  return rows.map(([id, name, url, category, description]) => ({
    id, name, url, category, description, icon: "",
  }));
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function getSites(): Promise<Site[]> {
  if (isTauri) return invoke<Site[]>("get_sites");
  const raw = localStorage.getItem(LS_KEY);
  if (raw) return JSON.parse(raw) as Site[];
  const sites = defaultSites();
  localStorage.setItem(LS_KEY, JSON.stringify(sites));
  return sites;
}

export async function saveSites(sites: Site[]): Promise<void> {
  if (isTauri) return invoke("save_sites", { sites });
  localStorage.setItem(LS_KEY, JSON.stringify(sites));
}

export async function openSite(site: Site): Promise<void> {
  if (!isTauri) {
    window.open(site.url, "_blank");
    return;
  }
  const label = `site-${site.id}`;
  const existing = await WebviewWindow.getByLabel(label);
  if (existing) {
    await existing.setFocus();
    return;
  }
  const win = new WebviewWindow(label, {
    url: site.url,
    title: site.name,
    width: 1280,
    height: 800,
  });
  void win.once("tauri://error", (e) => console.error("创建窗口失败", e));
}
