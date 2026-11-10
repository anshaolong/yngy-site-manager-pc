<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { newId, type Site } from "../api";
import {
  ICON_COLORS,
  colorForName,
  isIconify,
  letterIcon,
  loadIconSvg,
  parseLetterIcon,
  previewUrl,
  searchIcons,
} from "../icons";

const props = defineProps<{ site: Site | null; category: string; categories: string[] }>();
const emit = defineEmits<{ save: [site: Site]; close: [] }>();

const form = reactive({
  name: props.site?.name ?? "",
  url: props.site?.url ?? "",
  category: props.site?.category ?? "",
});

const fromLetter = parseLetterIcon(props.site?.icon ?? "");
const fromIconify = isIconify(props.site?.icon ?? "");
const legacyUrl = /^https?:\/\//i.test(props.site?.icon ?? "") ? props.site!.icon : "";

const mode = ref<"iconify" | "text">(fromIconify ? "iconify" : "text");
const iconName = ref(fromIconify ? props.site!.icon : "");
const letterText = ref(fromLetter?.text ?? "");
const letterColor = ref(fromLetter?.color || colorForName(props.site?.name ?? "") || ICON_COLORS[0]);

const iconQuery = ref("");
const iconResults = ref<string[]>([]);
const iconSearching = ref(false);
const iconMsg = ref("");
const svg = ref("");
const error = ref("");

watch(
  () => form.name,
  (name) => {
    if (!letterText.value) letterColor.value = colorForName(name || "a");
  },
);

watch(
  iconName,
  async (name) => {
    svg.value = "";
    if (!isIconify(name)) return;
    try {
      svg.value = await loadIconSvg(name);
    } catch {
      iconMsg.value = "图标不存在，请换个名称";
    }
  },
  { immediate: true },
);

const previewLetter = computed(() => (letterText.value || form.name.trim().charAt(0) || "?").slice(0, 2));
const previewBg = computed(() =>
  mode.value === "text" ? letterColor.value : colorForName(form.name || "a"),
);

async function runSearch() {
  const q = iconQuery.value.trim();
  if (!q) return;
  iconSearching.value = true;
  iconMsg.value = "";
  try {
    iconResults.value = await searchIcons(q, 24);
    if (!iconResults.value.length) iconMsg.value = "没有找到相关图标";
  } catch {
    iconMsg.value = "搜索失败，请检查网络";
  } finally {
    iconSearching.value = false;
  }
}

function pickIcon(name: string) {
  iconName.value = name;
  iconMsg.value = "";
}

function applyCustom(value: string) {
  const v = value.trim();
  if (!v) return;
  if (!isIconify(v)) {
    iconMsg.value = "格式应为 集合:图标，例如 mdi:home";
    return;
  }
  pickIcon(v);
}

function submit() {
  const name = form.name.trim();
  let url = form.url.trim();
  if (!name) {
    error.value = "请填写网站名称";
    return;
  }
  if (!url) {
    error.value = "请填写网站地址";
    return;
  }
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    new URL(url);
  } catch {
    error.value = "请输入正确的网址，例如 https://example.com";
    return;
  }
  error.value = "";

  const text = (letterText.value || "").slice(0, 2);
  const icon =
    mode.value === "text"
      ? text
        ? letterIcon(text, letterColor.value)
        : legacyUrl
      : iconName.value || legacyUrl;

  emit("save", {
    id: props.site?.id ?? newId(),
    name,
    url,
    category: props.site?.category ?? (props.category || "未分类"),
    description: props.site?.description ?? "",
    icon,
  });
}
</script>

<template>
  <div class="modal-mask" @click.self="emit('close')">
    <div class="modal modal-site">
      <div class="modal-head">
        <h3>{{ site ? "编辑网站" : "添加网站" }}</h3>
        <span v-if="!site" class="modal-head-hint">添加到「{{ category }}」</span>
      </div>

      <div class="site-preview">
        <span class="site-tile-icon" :style="{ background: previewBg }">
          <span v-if="mode === 'text'" class="site-tile-letter">{{ previewLetter }}</span>
          <span v-else-if="svg" class="site-tile-glyph" v-html="svg" />
          <span v-else class="site-tile-letter">{{ previewLetter }}</span>
        </span>
        <div class="site-preview-text">
          <div class="site-preview-name">{{ form.name || "网站名称" }}</div>
          <div class="site-preview-url">{{ form.url || "https://example.com" }}</div>
        </div>
      </div>

      <div class="form-item">
        <label>地址 <span class="req">*</span></label>
        <input v-model="form.url" placeholder="https://example.com" />
      </div>

      <div class="form-item">
        <label>名称 <span class="req">*</span></label>
        <input v-model="form.name" placeholder="例如：OA 办公系统" />
      </div>

      <div v-if="site" class="form-item">
        <label>分类</label>
        <input v-model="form.category" list="site-category-list" placeholder="分类名称" />
        <datalist id="site-category-list">
          <option v-for="c in categories" :key="c" :value="c" />
        </datalist>
      </div>

      <div class="form-item">
        <label>图标</label>
        <div class="seg icon-mode">
          <button :class="{ active: mode === 'text' }" @click="mode = 'text'">文字图标</button>
          <button :class="{ active: mode === 'iconify' }" @click="mode = 'iconify'">图标库</button>
        </div>

        <div v-if="mode === 'text'" class="text-icon-editor">
          <input v-model="letterText" class="set-input letter-input" maxlength="2" placeholder="1-2 个字" title="留空则使用网站图标" />
          <div class="color-dots">
            <button
              v-for="c in ICON_COLORS"
              :key="c"
              :style="{ background: c }"
              :class="{ active: letterColor === c }"
              :title="c"
              @click="letterColor = c"
            />
          </div>
        </div>

        <div v-else class="icon-picker">
          <div class="icon-search">
            <input
              v-model="iconQuery"
              class="set-input"
              placeholder="搜索 Iconify 图标，如 home、rocket…"
              @keyup.enter="runSearch"
            />
            <button class="btn btn-sm" :disabled="iconSearching" @click="runSearch">
              {{ iconSearching ? "搜索中" : "搜索" }}
            </button>
          </div>
          <div v-if="iconResults.length" class="icon-results">
            <button
              v-for="ic in iconResults"
              :key="ic"
              :title="ic"
              :class="{ active: iconName === ic }"
              @click="pickIcon(ic)"
            >
              <img :src="previewUrl(ic)" :alt="ic" />
            </button>
          </div>
          <div class="icon-custom">
            <input class="set-input" placeholder="或直接填写，如 mdi:home" @change="applyCustom(($event.target as HTMLInputElement).value)" />
          </div>
          <p v-if="iconName" class="set-status">已选择：{{ iconName }}</p>
        </div>

        <p v-if="iconMsg" class="set-status">{{ iconMsg }}</p>
      </div>

      <p v-if="error" class="form-error">{{ error }}</p>

      <div class="modal-footer">
        <button class="btn" @click="emit('close')">取消</button>
        <button class="btn btn-primary" @click="submit">完成</button>
      </div>
    </div>
  </div>
</template>
