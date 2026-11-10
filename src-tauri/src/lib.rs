use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use tauri_plugin_updater::UpdaterExt;

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
struct Site {
    id: String,
    name: String,
    url: String,
    category: String,
    #[serde(default)]
    description: String,
    #[serde(default)]
    icon: String,
}

fn data_file(app: &AppHandle) -> Result<PathBuf, String> {
    let dir = app.path().app_data_dir().map_err(|e| e.to_string())?;
    fs::create_dir_all(&dir).map_err(|e| e.to_string())?;
    Ok(dir.join("websites.json"))
}

fn default_sites() -> Vec<Site> {
    let rows = [
        ("oa", "OA 办公系统", "https://oa.example.com", "办公", "考勤、审批、流程办理"),
        ("mail", "企业邮箱", "https://mail.example.com", "办公", "公司内部邮件收发"),
        ("crm", "CRM 客户管理", "https://crm.example.com", "业务", "客户资料与跟进记录"),
        ("erp", "ERP 系统", "https://erp.example.com", "业务", "订单、库存与采购管理"),
        ("project", "项目管理", "https://project.example.com", "协作", "任务拆解与进度跟踪"),
        ("docs", "知识文档", "https://docs.example.com", "协作", "团队文档与知识库"),
    ];
    rows.iter()
        .map(|(id, name, url, category, description)| Site {
            id: id.to_string(),
            name: name.to_string(),
            url: url.to_string(),
            category: category.to_string(),
            description: description.to_string(),
            icon: String::new(),
        })
        .collect()
}

#[tauri::command]
fn get_sites(app: AppHandle) -> Result<Vec<Site>, String> {
    let path = data_file(&app)?;
    if !path.exists() {
        let sites = default_sites();
        let json = serde_json::to_string_pretty(&sites).map_err(|e| e.to_string())?;
        fs::write(&path, json).map_err(|e| e.to_string())?;
        return Ok(sites);
    }
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    serde_json::from_str(&content).map_err(|e| format!("配置文件解析失败: {e}"))
}

#[tauri::command]
fn save_sites(app: AppHandle, sites: Vec<Site>) -> Result<(), String> {
    let path = data_file(&app)?;
    let json = serde_json::to_string_pretty(&sites).map_err(|e| e.to_string())?;
    fs::write(&path, json).map_err(|e| e.to_string())
}

#[derive(Serialize)]
struct UpdateInfo {
    version: String,
    body: Option<String>,
    date: Option<String>,
}

fn build_updater(app: &AppHandle, endpoint: &str) -> Result<tauri_plugin_updater::Updater, String> {
    let url = tauri::Url::parse(endpoint).map_err(|e| format!("更新地址无效: {e}"))?;
    app.updater_builder()
        .endpoints(vec![url])
        .map_err(|e| e.to_string())?
        .build()
        .map_err(|e| e.to_string())
}

#[tauri::command]
async fn check_update(app: AppHandle, endpoint: String) -> Result<Option<UpdateInfo>, String> {
    let updater = build_updater(&app, &endpoint)?;
    let update = updater.check().await.map_err(|e| e.to_string())?;
    Ok(update.map(|u| UpdateInfo {
        version: u.version.to_string(),
        body: u.body.clone(),
        date: u.date.map(|d| d.to_string()),
    }))
}

#[tauri::command]
async fn install_update(app: AppHandle, endpoint: String) -> Result<(), String> {
    let updater = build_updater(&app, &endpoint)?;
    let update = updater
        .check()
        .await
        .map_err(|e| e.to_string())?
        .ok_or("没有可用的更新")?;
    update
        .download_and_install(|_, _| {}, || {})
        .await
        .map_err(|e| format!("更新安装失败: {e}"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::new().build())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            get_sites,
            save_sites,
            check_update,
            install_update
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
