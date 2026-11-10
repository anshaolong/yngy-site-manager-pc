<script setup lang="ts">
import { onMounted, ref } from "vue";
import { getSites, isTauri, newId, saveSites, type Site } from "./api";
import { iconForName } from "./categories";
import HomeView from "./views/HomeView.vue";
import SettingsModal from "./components/SettingsModal.vue";
import SiteFormModal from "./components/SiteFormModal.vue";
import { loadSettings, saveSettings, type Settings, type SettingsTab } from "./settings";
import { checkUpdate, installUpdate, type UpdateInfo } from "./updater";

const sites = ref<Site[]>([]);
const error = ref("");
const settings = ref<Settings>(loadSettings());
const showSettings = ref(false);
const settingsTab = ref<SettingsTab>("general");
const addCategory = ref("");
const showAdd = ref(false);

const pendingUpdate = ref<UpdateInfo | null>(null);
const updateBusy = ref(false);
const updateMsg = ref("");

async function reload() {
  try {
    sites.value = await getSites();
    error.value = "";
  } catch (e) {
    error.value = String(e);
  }
}

function updateSettings(next: Settings) {
  settings.value = next;
  saveSettings(next);
}

function openSettings(tab: SettingsTab = "general") {
  settingsTab.value = tab;
  showSettings.value = true;
}

function openAdd(category: string) {
  addCategory.value = category;
  showAdd.value = true;
}

async function createSite(site: Site) {
  try {
    await saveSites([...sites.value, site]);
    showAdd.value = false;
    await reload();
  } catch (e) {
    error.value = String(e);
  }
}

// 首次启动时用网站里已有的分类初始化分类配置
function seedCategories() {
  if (settings.value.categories.length) return;
  const names = [...new Set(sites.value.map((s) => s.category).filter(Boolean))];
  if (!names.length) return;
  updateSettings({
    ...settings.value,
    categories: names.map((name) => ({ id: newId(), name, icon: iconForName(name) })),
  });
}

async function renameCategory(from: string, to: string) {
  const next = sites.value.map((s) => (s.category === from ? { ...s, category: to } : s));
  try {
    await saveSites(next);
    sites.value = next;
  } catch (e) {
    error.value = String(e);
  }
}

async function autoCheck() {
  if (!isTauri || !settings.value.updateUrl.trim()) return;
  try {
    pendingUpdate.value = await checkUpdate(settings.value.updateUrl);
  } catch {
    // 启动时静默检查，失败不打扰用户
  }
}

async function runUpdate() {
  if (!pendingUpdate.value || updateBusy.value) return;
  updateBusy.value = true;
  updateMsg.value = "";
  try {
    await installUpdate(settings.value.updateUrl, (m) => (updateMsg.value = m));
  } catch (e) {
    updateBusy.value = false;
    updateMsg.value = `更新失败：${String(e)}`;
  }
}

onMounted(() => {
  void reload().then(seedCategories);
  void autoCheck();
});
</script>

<template>
  <div class="app" :class="`overlay-${settings.overlay}`">
    <p v-if="error" class="error-bar app-error">{{ error }}</p>
    <div v-if="pendingUpdate" class="update-bar">
      <span class="update-text" :title="pendingUpdate.body || ''">
        发现新版本 {{ pendingUpdate.version }}
        <template v-if="updateMsg">· {{ updateMsg }}</template>
      </span>
      <button class="btn btn-primary btn-sm" :disabled="updateBusy" @click="runUpdate">
        {{ updateBusy ? "更新中…" : "立即更新" }}
      </button>
      <button class="btn btn-sm" :disabled="updateBusy" @click="pendingUpdate = null">稍后</button>
    </div>
    <HomeView :sites="sites" :settings="settings" @open-settings="openSettings" @add="openAdd" />
    <SiteFormModal
      v-if="showAdd"
      :site="null"
      :category="addCategory"
      :categories="settings.categories.map((c) => c.name)"
      @save="createSite"
      @close="showAdd = false"
    />
    <SettingsModal
      v-if="showSettings"
      :settings="settings"
      :sites="sites"
      :initial-tab="settingsTab"
      @change="updateSettings"
      @rename-category="renameCategory"
      @sites-changed="reload"
      @close="showSettings = false"
    />
  </div>
</template>
