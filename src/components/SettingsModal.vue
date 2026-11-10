<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import type { Settings, SettingsTab } from "../settings";
import { CATEGORY_ICONS, type Category } from "../categories";
import { newId, type Site } from "../api";
import { checkUpdate, currentVersion, installUpdate, type UpdateInfo } from "../updater";
import CategoryIcon from "./CategoryIcon.vue";
import SiteManager from "./SiteManager.vue";
import { isIconify, previewUrl, searchIcons } from "../icons";

const props = defineProps<{ settings: Settings; sites: Site[]; initialTab?: SettingsTab }>();
const emit = defineEmits<{
  change: [Settings];
  close: [];
  renameCategory: [string, string];
  sitesChanged: [];
}>();

type Tab = SettingsTab;

const tab = ref<Tab>(props.initialTab ?? "general");

const groups = [
  { key: "general", label: "常规设置" },
  { key: "sites", label: "网站管理" },
  { key: "categories", label: "分类" },
  { key: "appearance", label: "外观" },
  { key: "update", label: "更新" },
  { key: "about", label: "关于" },
] as const;

const version = ref("-");
const pending = ref<UpdateInfo | null>(null);
const checking = ref(false);
const installing = ref(false);
const status = ref("");

onMounted(async () => {
  version.value = await currentVersion();
});

async function doCheck() {
  checking.value = true;
  status.value = "";
  pending.value = null;
  try {
    const u = await checkUpdate(props.settings.updateUrl);
    if (u) {
      pending.value = u;
      status.value = `发现新版本 ${u.version}`;
    } else {
      status.value = "已是最新版本";
    }
  } catch (e) {
    status.value = String(e).replace(/^Error:\s*/, "");
  } finally {
    checking.value = false;
  }
}

async function doInstall() {
  installing.value = true;
  try {
    await installUpdate(props.settings.updateUrl, (m) => (status.value = m));
  } catch (e) {
    installing.value = false;
    status.value = `更新失败：${String(e)}`;
  }
}

const sizeOptions = [
  { value: "sm", label: "小" },
  { value: "md", label: "中" },
  { value: "lg", label: "大" },
] as const;

const overlayOptions = [
  { value: "light", label: "浅" },
  { value: "mid", label: "中" },
  { value: "dark", label: "深" },
] as const;

const navOptions = [
  { value: "left", label: "左" },
  { value: "right", label: "右" },
  { value: "top", label: "上" },
  { value: "bottom", label: "下" },
] as const;

const current = computed(() => groups.find((g) => g.key === tab.value)!.label);

function set<K extends keyof Settings>(key: K, value: Settings[K]) {
  emit("change", { ...props.settings, [key]: value });
}

const pickerFor = ref("");
const catMsg = ref("");

const siteCategories = computed(() => [
  ...new Set([...props.settings.categories.map((c) => c.name), ...props.sites.map((s) => s.category)]),
].filter(Boolean));

function countOf(name: string) {
  return props.sites.filter((s) => s.category === name).length;
}

function putCategories(next: Category[]) {
  emit("change", { ...props.settings, categories: next });
}

function addCategory() {
  let name = "新分类";
  let n = 2;
  while (props.settings.categories.some((c) => c.name === name)) name = `新分类 ${n++}`;
  putCategories([...props.settings.categories, { id: newId(), name, icon: "folder" }]);
  catMsg.value = "";
}

function renameCategory(c: Category, ev: Event) {
  const input = ev.target as HTMLInputElement;
  const name = input.value.trim();
  if (!name || name === c.name) {
    input.value = c.name;
    return;
  }
  if (props.settings.categories.some((x) => x.id !== c.id && x.name === name)) {
    input.value = c.name;
    catMsg.value = "已存在同名分类";
    return;
  }
  putCategories(props.settings.categories.map((x) => (x.id === c.id ? { ...x, name } : x)));
  emit("renameCategory", c.name, name);
  catMsg.value = "";
}

function setIcon(c: Category, icon: string) {
  putCategories(props.settings.categories.map((x) => (x.id === c.id ? { ...x, icon } : x)));
  pickerFor.value = "";
}

const iconQuery = ref("");
const iconResults = ref<string[]>([]);
const iconSearching = ref(false);
const iconMsg = ref("");

async function runIconSearch() {
  const q = iconQuery.value.trim();
  if (!q) {
    iconResults.value = [];
    return;
  }
  iconSearching.value = true;
  iconMsg.value = "";
  try {
    iconResults.value = await searchIcons(q);
    if (!iconResults.value.length) iconMsg.value = "没有找到相关图标";
  } catch {
    iconResults.value = [];
    iconMsg.value = "搜索失败，请检查网络";
  } finally {
    iconSearching.value = false;
  }
}

function applyCustomIcon(c: Category, value: string) {
  const v = value.trim();
  iconMsg.value = "";
  if (!isIconify(v)) {
    iconMsg.value = "格式应为 集合:图标，例如 mdi:home";
    return;
  }
  setIcon(c, v);
}

function moveCategory(i: number, dir: -1 | 1) {
  const list = [...props.settings.categories];
  const j = i + dir;
  if (j < 0 || j >= list.length) return;
  [list[i], list[j]] = [list[j], list[i]];
  putCategories(list);
}

function removeCategory(c: Category) {
  const used = countOf(c.name);
  if (used) {
    catMsg.value = `「${c.name}」下还有 ${used} 个网站，请先在管理页把它们改到其他分类`;
    return;
  }
  putCategories(props.settings.categories.filter((x) => x.id !== c.id));
  catMsg.value = "";
}
</script>

<template>
  <div class="settings-mask" @click.self="emit('close')">
    <div class="settings-modal">
      <aside class="settings-nav">
        <div class="settings-nav-title">设置</div>
        <button
          v-for="g in groups"
          :key="g.key"
          class="settings-nav-item"
          :class="{ active: tab === g.key }"
          @click="tab = g.key"
        >
          <svg
            v-if="g.key === 'general'"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
          <svg
            v-else-if="g.key === 'categories'"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M12 3 3 8l9 5 9-5-9-5z" />
            <path d="m3 13 9 5 9-5" />
          </svg>
          <svg
            v-else-if="g.key === 'appearance'"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="3" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          <svg
            v-else-if="g.key === 'update'"
            width="15"
            height="15"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36" />
            <path d="M21 3v6h-6" />
          </svg>
          <svg v-else width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 11v5M12 8h.01" />
          </svg>
          {{ g.label }}
        </button>
        <div class="settings-nav-footer">v{{ version }}</div>
      </aside>

      <section class="settings-body">
        <div class="settings-head">
          <h3>{{ current }}</h3>
          <button class="settings-close" title="关闭" @click="emit('close')">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <div class="settings-content">
          <template v-if="tab === 'general'">
            <div class="set-group-title">首页</div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">显示图标名称</div>
                <div class="set-row-desc">在磁贴下方显示网站名称</div>
              </div>
              <button
                class="switch"
                :class="{ on: settings.showNames }"
                role="switch"
                :aria-checked="settings.showNames"
                @click="set('showNames', !settings.showNames)"
              />
            </div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">显示搜索框</div>
                <div class="set-row-desc">首页顶部显示网站搜索</div>
              </div>
              <button
                class="switch"
                :class="{ on: settings.showSearch }"
                role="switch"
                :aria-checked="settings.showSearch"
                @click="set('showSearch', !settings.showSearch)"
              />
            </div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">显示「添加」磁贴</div>
                <div class="set-row-desc">在图标网格末尾显示添加入口</div>
              </div>
              <button
                class="switch"
                :class="{ on: settings.showAddTile }"
                role="switch"
                :aria-checked="settings.showAddTile"
                @click="set('showAddTile', !settings.showAddTile)"
              />
            </div>
          </template>

          <template v-else-if="tab === 'sites'">
            <SiteManager :sites="sites" :categories="siteCategories" @changed="emit('sitesChanged')" />
          </template>

          <template v-else-if="tab === 'categories'">
            <div class="set-group-title">首页分类</div>
            <div class="cat-list">
              <div v-for="(c, i) in settings.categories" :key="c.id" class="cat-item">
                <div class="cat-row">
                  <button
                    class="cat-icon-btn"
                    :class="{ active: pickerFor === c.id }"
                    title="更换图标"
                    @click="pickerFor = pickerFor === c.id ? '' : c.id"
                  >
                    <CategoryIcon :name="c.icon" :size="15" />
                  </button>
                  <input class="set-input" :value="c.name" @change="renameCategory(c, $event)" />
                  <span class="cat-count">{{ countOf(c.name) }} 个</span>
                  <button class="btn btn-sm" :disabled="i === 0" title="上移" @click="moveCategory(i, -1)">↑</button>
                  <button
                    class="btn btn-sm"
                    :disabled="i === settings.categories.length - 1"
                    title="下移"
                    @click="moveCategory(i, 1)"
                  >
                    ↓
                  </button>
                  <button class="btn btn-sm btn-danger" @click="removeCategory(c)">删除</button>
                </div>
                <div v-if="pickerFor === c.id" class="icon-picker">
                  <div class="icon-search">
                    <input
                      v-model="iconQuery"
                      class="set-input"
                      placeholder="搜索 Iconify 图标，如 home、database…"
                      @keyup.enter="runIconSearch"
                    />
                    <button class="btn btn-sm" :disabled="iconSearching" @click="runIconSearch">
                      {{ iconSearching ? "搜索中" : "搜索" }}
                    </button>
                  </div>
                  <div v-if="iconResults.length" class="icon-results">
                    <button
                      v-for="ic in iconResults"
                      :key="ic"
                      :title="ic"
                      :class="{ active: c.icon === ic }"
                      @click="setIcon(c, ic)"
                    >
                      <img :src="previewUrl(ic)" :alt="ic" />
                    </button>
                  </div>
                  <div class="icon-builtin">
                    <button
                      v-for="ic in CATEGORY_ICONS"
                      :key="ic.key"
                      :class="{ active: c.icon === ic.key }"
                      :title="ic.label"
                      @click="setIcon(c, ic.key)"
                    >
                      <CategoryIcon :name="ic.key" :size="15" />
                    </button>
                  </div>
                  <div class="icon-custom">
                    <input
                      class="set-input"
                      :placeholder="isIconify(c.icon) ? c.icon : '或直接填写，如 mdi:home'"
                      @change="applyCustomIcon(c, ($event.target as HTMLInputElement).value)"
                    />
                  </div>
                  <p v-if="iconMsg" class="set-status">{{ iconMsg }}</p>
                </div>
              </div>
            </div>
            <p v-if="!settings.categories.length" class="set-status">暂无分类，添加后会显示在首页左侧栏</p>
            <div class="set-row set-actions">
              <button class="btn btn-sm" @click="addCategory">+ 添加分类</button>
            </div>
            <p v-if="catMsg" class="set-status">{{ catMsg }}</p>
          </template>

          <template v-else-if="tab === 'appearance'">
            <div class="set-group-title">分类栏</div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">分类栏位置</div>
                <div class="set-row-desc">选择分类栏停靠在窗口的哪一侧</div>
              </div>
              <div class="seg">
                <button
                  v-for="o in navOptions"
                  :key="o.value"
                  :class="{ active: settings.navPosition === o.value }"
                  @click="set('navPosition', o.value)"
                >
                  {{ o.label }}
                </button>
              </div>
            </div>
            <div class="set-group-title">图标</div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">图标尺寸</div>
                <div class="set-row-desc">调整首页磁贴的大小</div>
              </div>
              <div class="seg">
                <button
                  v-for="o in sizeOptions"
                  :key="o.value"
                  :class="{ active: settings.tileSize === o.value }"
                  @click="set('tileSize', o.value)"
                >
                  {{ o.label }}
                </button>
              </div>
            </div>
            <div class="set-group-title">背景</div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">背景遮罩</div>
                <div class="set-row-desc">遮罩越深，壁纸越暗、图标越清晰</div>
              </div>
              <div class="seg">
                <button
                  v-for="o in overlayOptions"
                  :key="o.value"
                  :class="{ active: settings.overlay === o.value }"
                  @click="set('overlay', o.value)"
                >
                  {{ o.label }}
                </button>
              </div>
            </div>
          </template>

          <template v-else-if="tab === 'update'">
            <div class="set-group-title">版本</div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">当前版本</div>
                <div class="set-row-desc">应用启动时会自动检查一次更新</div>
              </div>
              <span class="set-row-value">v{{ version }}</span>
            </div>
            <div class="set-block">
              <div class="set-row-title">更新地址</div>
              <div class="set-row-desc">服务器上 latest.json 的完整地址，修改后立即生效</div>
              <input
                class="set-input"
                :value="settings.updateUrl"
                placeholder="http://192.168.1.10/updates/latest.json"
                spellcheck="false"
                @change="set('updateUrl', ($event.target as HTMLInputElement).value.trim())"
              />
            </div>
            <div class="set-row set-actions">
              <button class="btn btn-sm" :disabled="checking || installing || !settings.updateUrl" @click="doCheck">
                {{ checking ? "检查中…" : "检查更新" }}
              </button>
              <button v-if="pending" class="btn btn-primary btn-sm" :disabled="installing" @click="doInstall">
                {{ installing ? "更新中…" : "立即更新" }}
              </button>
            </div>
            <p v-if="status" class="set-status">{{ status }}</p>
            <p v-if="pending && pending.body" class="set-status">{{ pending.body }}</p>
          </template>

          <template v-else>
            <div class="set-group-title">应用信息</div>
            <div class="set-row">
              <div class="set-row-text"><div class="set-row-title">应用名称</div></div>
              <span class="set-row-value">云南钢友工作台</span>
            </div>
            <div class="set-row">
              <div class="set-row-text"><div class="set-row-title">版本</div></div>
              <span class="set-row-value">v{{ version }}</span>
            </div>
            <div class="set-row">
              <div class="set-row-text"><div class="set-row-title">技术栈</div></div>
              <span class="set-row-value">Tauri 2 + Vue 3</span>
            </div>
            <div class="set-row">
              <div class="set-row-text">
                <div class="set-row-title">数据存储</div>
                <div class="set-row-desc">网站列表保存在系统应用数据目录的 websites.json，界面偏好保存在本机</div>
              </div>
            </div>
          </template>
        </div>
      </section>
    </div>
  </div>
</template>
