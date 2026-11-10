# 云南钢友工作台

基于 **Tauri 2 + Vue 3 + TypeScript** 的桌面应用：首页按分类展示公司工作网站，点击卡片在应用内嵌窗口打开；网站列表可在应用内维护。

## 功能

- 首页卡片导航：分类分组、搜索过滤、自动获取网站 favicon（失败回退首字母图标）
- 内嵌窗口打开网站：独立窗口、登录态持久保存、重复点击聚焦已开窗口
- 网站管理：添加 / 编辑 / 删除 / 上下移动排序，修改即时生效
- 数据存储：`websites.json` 保存在系统应用数据目录
  - Windows: `%APPDATA%\yngy-site-manager-pc\websites.json`
  - macOS: `~/Library/Application Support/yngy-site-manager-pc/websites.json`
- 主窗口尺寸位置自动记忆（tauri-plugin-window-state）

## 环境要求

- Node.js 18+
- Rust（https://rustup.rs）
- Windows: 无需额外依赖（WebView2 系统自带）
- macOS: `xcode-select --install`

## 本地开发

```bash
npm install
npm run tauri dev
```

仅调试前端界面（浏览器中用 localStorage 代替本地文件）：

```bash
npm run dev
```

## 打包分发

应用启用了更新签名，构建前必须设置签名私钥（私钥在 `src-tauri/keys/updater.key`，已加入 `.gitignore`，请务必备份）：

Windows PowerShell：
```powershell
$env:TAURI_SIGNING_PRIVATE_KEY = "src-tauri\keys\updater.key"
$env:TAURI_SIGNING_PRIVATE_KEY_PASSWORD = ""
npm run tauri build
```

macOS / Linux：
```bash
export TAURI_SIGNING_PRIVATE_KEY=src-tauri/keys/updater.key
export TAURI_SIGNING_PRIVATE_KEY_PASSWORD=
npm run tauri build
```

产物在 `src-tauri/target/release/bundle/`：
- Windows: `.msi` / `.exe` 安装包，以及更新包 `*.nsis.zip` + `.sig`
- macOS: `.dmg`（需在 Mac 上构建；未签名时首次打开请到 系统设置 → 隐私与安全性 中允许），更新包为 `*.app.tar.gz` + `.sig`

## 发布新版本

1. 修改版本号：`package.json` 与 `src-tauri/tauri.conf.json` 的 `version`
2. 按上面的命令构建
3. 把更新包和 `latest.json` 上传到服务器的更新目录（静态 HTTP 可直接访问）
4. 编辑 `latest.json`，`signature` 填更新包对应 `.sig` 文件的完整内容：

```json
{
  "version": "0.1.1",
  "notes": "本次更新说明",
  "pub_date": "2026-11-09T10:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": ".sig 文件内容",
      "url": "http://服务器地址/updates/yngy-workbench_0.1.1_x64-setup.nsis.zip"
    }
  }
}
```

5. 客户端在「设置 → 更新」里填写 `latest.json` 的地址即可，之后每次启动会自动检查；发现新版本时首页顶部会出现更新提示。要免去每个用户手动填写，打包前把 `src/settings.ts` 里的 `DEFAULT_UPDATE_URL` 改成固定地址即可。

服务器要求：`latest.json` 不能被缓存（`Cache-Control: no-store`），目录允许匿名 GET，不需要配置 CORS。

## 目录结构

```
src/                    # Vue 前端
  api.ts                # 数据读写 + 打开内嵌窗口（Tauri/浏览器双模式）
  settings.ts           # 界面偏好（含更新地址）
  updater.ts            # 检查/安装更新
  views/HomeView.vue    # 首页：搜索 + 分类 + 卡片网格
  views/ManageView.vue  # 管理页：增删改 + 排序
  components/           # SiteCard / SiteIcon / SiteFormModal / SettingsModal
src-tauri/
  src/lib.rs            # websites.json 读写 + check_update / install_update
  capabilities/         # 权限：内嵌窗口、进程重启
  keys/                 # 更新签名密钥（勿外传）
```
