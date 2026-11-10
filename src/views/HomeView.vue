<script setup lang="ts">
import { computed, nextTick, onMounted, ref, watch } from "vue";
import type { Site } from "../api";
import type { Settings } from "../settings";
import { iconForName, type Category } from "../categories";
import SiteCard from "../components/SiteCard.vue";
import CategoryIcon from "../components/CategoryIcon.vue";

const props = defineProps<{ sites: Site[]; settings: Settings }>();
const emit = defineEmits<{ openSettings: [tab?: "sites"]; add: [string] }>();

const keyword = ref("");
const activeCat = ref("全部");
const isSide = computed(() => props.settings.navPosition === "left" || props.settings.navPosition === "right");

// 从当前分类直接添加；「全部」时落到第一个分类
const targetCategory = computed(() => {
  if (activeCat.value !== "全部") return activeCat.value;
  return props.settings.categories[0]?.name ?? "未分类";
});

// 设置里配置的分类 + 网站上用到但未配置的分类（兜底显示，避免网站被隐藏）
const categories = computed<Category[]>(() => {
  const declared = props.settings.categories;
  const names = new Set(declared.map((c) => c.name));
  const extra = [...new Set(props.sites.map((s) => s.category).filter(Boolean))]
    .filter((n) => !names.has(n))
    .map((n) => ({ id: `extra-${n}`, name: n, icon: iconForName(n) }));
  return [...declared, ...extra];
});

watch(categories, (list) => {
  if (activeCat.value !== "全部" && !list.some((c) => c.name === activeCat.value)) {
    activeCat.value = "全部";
  }
});

// ---- 分类栏滚动：隐藏滚动条，两端渐变遮罩，滚轮 / 拖动滚动 ----

const navInner = ref<HTMLElement | null>(null);
const navFade = ref("");

function updateNavFade() {
  const el = navInner.value;
  if (!el) return;
  if (isSide.value) {
    const up = el.scrollTop > 2;
    const down = el.scrollTop + el.clientHeight < el.scrollHeight - 2;
    navFade.value = up && down ? "mask-v-both" : up ? "mask-v-up" : down ? "mask-v-down" : "";
  } else {
    const left = el.scrollLeft > 2;
    const right = el.scrollLeft + el.clientWidth < el.scrollWidth - 2;
    navFade.value = left && right ? "mask-h-both" : left ? "mask-h-left" : right ? "mask-h-right" : "";
  }
}

// 上下布局时把纵向滚轮转成横向滚动
function onNavWheel(e: WheelEvent) {
  const el = navInner.value;
  if (!el || isSide.value) return;
  const delta = Math.abs(e.deltaY) >= Math.abs(e.deltaX) ? e.deltaY : e.deltaX;
  if (delta) el.scrollLeft += delta;
}

// 拖动滚动（主要用于上下布局，左右布局也可用）
let dragStart = 0;
let dragScroll = 0;
let dragged = false;

function onNavPointerDown(e: PointerEvent) {
  const el = navInner.value;
  if (!el) return;
  dragStart = isSide.value ? e.clientY : e.clientX;
  dragScroll = isSide.value ? el.scrollTop : el.scrollLeft;
  dragged = false;
  el.setPointerCapture(e.pointerId);
}

function onNavPointerMove(e: PointerEvent) {
  const el = navInner.value;
  if (!el || !el.hasPointerCapture(e.pointerId)) return;
  const pos = isSide.value ? e.clientY : e.clientX;
  const delta = dragStart - pos;
  if (Math.abs(delta) > 4) dragged = true;
  if (dragged) {
    if (isSide.value) el.scrollTop = dragScroll + delta;
    else el.scrollLeft = dragScroll + delta;
  }
}

function onNavPointerUp(e: PointerEvent) {
  const el = navInner.value;
  if (el?.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
}

// 拖动后抑制误触点击
function onNavClickCapture(e: MouseEvent) {
  if (dragged) {
    e.stopPropagation();
    e.preventDefault();
    dragged = false;
  }
}

onMounted(() => nextTick(updateNavFade));
watch([categories, isSide], () => nextTick(updateNavFade));

const filtered = computed(() => {
  const kw = keyword.value.trim().toLowerCase();
  return props.sites.filter(
    (s) =>
      (activeCat.value === "全部" || s.category === activeCat.value) &&
      (!kw ||
        s.name.toLowerCase().includes(kw) ||
        s.url.toLowerCase().includes(kw) ||
        s.description.toLowerCase().includes(kw)),
  );
});
</script>

<template>
  <div
    class="home"
    :class="[`nav-${settings.navPosition}`, { 'hide-names': !settings.showNames }]"
    :data-size="settings.tileSize"
  >
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <div
          ref="navInner"
          class="sidebar-nav-inner"
          :class="navFade"
          @scroll="updateNavFade"
          @wheel.prevent="onNavWheel"
          @pointerdown="onNavPointerDown"
          @pointermove="onNavPointerMove"
          @pointerup="onNavPointerUp"
          @pointercancel="onNavPointerUp"
          @click.capture="onNavClickCapture"
        >
          <button class="nav-item" :class="{ active: activeCat === '全部' }" @click="activeCat = '全部'">
            <span class="nav-item-icon"><CategoryIcon name="grid" :size="15" /></span>
            <span class="nav-item-text">全部</span>
          </button>
          <button
            v-for="c in categories"
            :key="c.id"
            class="nav-item"
            :class="{ active: activeCat === c.name }"
            @click="activeCat = c.name"
          >
            <span class="nav-item-icon"><CategoryIcon :name="c.icon" :size="15" /></span>
            <span class="nav-item-text">{{ c.name }}</span>
          </button>
        </div>
      </nav>
    </aside>
    <div class="sidebar-footer">
      <button class="nav-item" @click="emit('openSettings')">
        <span class="nav-item-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0" />
            <circle cx="16" cy="6" r="2" />
            <circle cx="10" cy="12" r="2" />
            <circle cx="18" cy="18" r="2" />
          </svg>
        </span>
        <span class="nav-item-text">设置</span>
      </button>
    </div>

    <main class="home-main">
      <div v-if="settings.showSearch" class="search-pill">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input v-model="keyword" placeholder="搜索网站名称、网址或简介…" />
      </div>

      <div v-if="filtered.length" class="icon-grid">
        <SiteCard v-for="site in filtered" :key="site.id" :site="site" />
        <button v-if="settings.showAddTile" class="site-tile add-tile" title="添加网站" @click="emit('add', targetCategory)">
          <span class="site-tile-icon">+</span>
          <span class="site-tile-name">添加</span>
        </button>
      </div>
      <div v-else class="empty-state">
        <p class="empty">
          {{ sites.length ? (activeCat === "全部" ? "没有匹配的网站，换个关键词试试" : `「${activeCat}」下还没有网站`) : "还没有添加网站" }}
        </p>
        <button v-if="settings.showAddTile" class="site-tile add-tile" title="添加网站" @click="emit('add', targetCategory)">
          <span class="site-tile-icon">+</span>
          <span class="site-tile-name">添加</span>
        </button>
      </div>
    </main>
  </div>
</template>
