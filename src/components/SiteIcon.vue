<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { Site } from "../api";
import { colorForName, isIconify, loadIconSvg, parseLetterIcon } from "../icons";

const props = defineProps<{ site: Site }>();

const failed = ref(false);
const svg = ref("");

const letterDef = computed(() => parseLetterIcon(props.site.icon));
const iconify = computed(() => isIconify(props.site.icon));
const urlIcon = computed(() => (/^https?:\/\//i.test(props.site.icon) ? props.site.icon : ""));

const favicon = computed(() => {
  if (props.site.icon || urlIcon.value) return urlIcon.value;
  try {
    return new URL(props.site.url).origin + "/favicon.ico";
  } catch {
    return "";
  }
});

watch(
  () => props.site.icon,
  async (icon) => {
    failed.value = false;
    if (!isIconify(icon)) {
      svg.value = "";
      return;
    }
    try {
      svg.value = await loadIconSvg(icon);
    } catch {
      svg.value = "";
    }
  },
  { immediate: true },
);

const bg = computed(() => letterDef.value?.color || colorForName(props.site.name));
const letter = computed(() => props.site.name.trim().charAt(0).toUpperCase() || "?");
// 图标库图标、文字图标都铺底色，图片类图标保持白底
const filled = computed(() => Boolean(letterDef.value) || Boolean(iconify.value && svg.value));
</script>

<template>
  <span class="site-tile-icon" :style="filled ? { background: bg } : undefined">
    <span v-if="letterDef" class="site-tile-letter">{{ letterDef.text }}</span>
    <span v-else-if="iconify && svg" class="site-tile-glyph" v-html="svg" />
    <img v-else-if="favicon && !failed" :src="favicon" alt="" @error="failed = true" />
    <span v-else class="site-tile-letter" :style="{ background: bg }">{{ letter }}</span>
  </span>
</template>
