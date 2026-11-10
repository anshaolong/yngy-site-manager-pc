export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface CategoryIconDef {
  key: string;
  label: string;
  paths: string[];
}

export const CATEGORY_ICONS: CategoryIconDef[] = [
  { key: "grid", label: "应用", paths: ["M3 3h7v7H3z", "M14 3h7v7h-7z", "M3 14h7v7H3z", "M14 14h7v7h-7z"] },
  {
    key: "folder",
    label: "文件夹",
    paths: ["M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"],
  },
  {
    key: "briefcase",
    label: "办公",
    paths: ["M3 8h18v11H3z", "M8 8V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v3", "M3 13h18"],
  },
  {
    key: "chart",
    label: "图表",
    paths: ["M5 20V12", "M11 20V6", "M17 20v-8", "M3 20h18"],
  },
  {
    key: "users",
    label: "协作",
    paths: ["M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2", "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8", "M22 21v-2a4 4 0 0 0-3-3.87"],
  },
  {
    key: "mail",
    label: "邮件",
    paths: ["M3 6h18v12H3z", "m3 7 9 6 9-6"],
  },
  {
    key: "database",
    label: "数据",
    paths: [
      "M12 8c4.4 0 8-1.3 8-3s-3.6-3-8-3-8 1.3-8 3 3.6 3 8 3",
      "M4 5v14c0 1.7 3.6 3 8 3s8-1.3 8-3V5",
      "M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3",
    ],
  },
  {
    key: "globe",
    label: "站点",
    paths: ["M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18", "M3 12h18", "M12 3a15 15 0 0 1 0 18 15 15 0 0 1 0-18"],
  },
  {
    key: "star",
    label: "收藏",
    paths: ["m12 3 2.9 5.9 6.5.9-4.7 4.6 1.1 6.5L12 17.8 6.2 20.9l1.1-6.5L2.6 9.8l6.5-.9z"],
  },
  {
    key: "bookmark",
    label: "文档",
    paths: ["M6 3h12v18l-6-4-6 4z"],
  },
  {
    key: "link",
    label: "链接",
    paths: [
      "M10 13a5 5 0 0 0 7 0l2-2a5 5 0 0 0-7-7l-1 1",
      "M14 11a5 5 0 0 0-7 0l-2 2a5 5 0 0 0 7 7l1-1",
    ],
  },
];

const NAME_ICONS: [RegExp, string][] = [
  [/办公|行政|oa/i, "briefcase"],
  [/业务|销售|客户|crm|市场/i, "chart"],
  [/协作|沟通|团队|项目/i, "users"],
  [/研发|技术|开发|运维|数据/i, "database"],
  [/文档|知识|资料/i, "bookmark"],
  [/人事|招聘|考勤/i, "users"],
  [/财务|报表/i, "chart"],
  [/邮件|邮箱/i, "mail"],
];

export function iconForName(name: string): string {
  return NAME_ICONS.find(([re]) => re.test(name))?.[1] ?? "folder";
}
