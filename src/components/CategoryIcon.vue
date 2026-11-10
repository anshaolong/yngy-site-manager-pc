<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { CATEGORY_ICONS } from "../categories";
import { isIconify, loadIconSvg } from "../icons";

const props = defineProps<{ name: string; size?: number }>();

const def = computed(() => CATEGORY_ICONS.find((i) => i.key === props.name) ?? CATEGORY_ICONS[0]);
const iconify = computed(() => isIconify(props.name));
const svg = ref("");

watch(
  () => props.name,
  async (name) => {
    if (!isIconify(name)) {
      svg.value = "";
      return;
    }
    try {
      svg.value = await loadIconSvg(name);
    } catch {
      svg.value = "";
    }
  },
  { immediate: true },
);

const box = computed(() => `${props.size || 16}px`);
</script>

<template>
  <span v-if="iconify && svg" class="iconify" :style="{ width: box, height: box }" v-html="svg" />
  <svg
    v-else
    :width="size || 16"
    :height="size || 16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
  >
    <path v-for="(d, i) in def.paths" :key="i" :d="d" />
  </svg>
</template>
