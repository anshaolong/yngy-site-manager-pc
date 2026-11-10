<script setup lang="ts">
import { openSite, type Site } from "../api";
import SiteIcon from "./SiteIcon.vue";

defineProps<{ site: Site }>();
</script>

<template>
  <button class="site-tile" :title="site.url" @click="openSite(site)">
    <SiteIcon :site="site" />
    <span class="site-tile-name">{{ site.name }}</span>
  </button>
</template>
