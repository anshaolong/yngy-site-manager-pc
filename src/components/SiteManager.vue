<script setup lang="ts">
import { ref } from "vue";
import { saveSites, type Site } from "../api";
import SiteFormModal from "./SiteFormModal.vue";
import SiteIcon from "./SiteIcon.vue";

const props = defineProps<{ sites: Site[]; categories: string[] }>();
const emit = defineEmits<{ changed: [] }>();

const showForm = ref(false);
const editing = ref<Site | null>(null);
const saving = ref(false);
const error = ref("");

async function persist(next: Site[]) {
  saving.value = true;
  error.value = "";
  try {
    await saveSites(next);
    emit("changed");
  } catch (e) {
    error.value = String(e);
  } finally {
    saving.value = false;
  }
}

function openAdd() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(site: Site) {
  editing.value = site;
  showForm.value = true;
}

function onSave(site: Site) {
  const next = [...props.sites];
  const idx = next.findIndex((s) => s.id === site.id);
  if (idx >= 0) next[idx] = site;
  else next.push(site);
  showForm.value = false;
  void persist(next);
}

function move(i: number, dir: -1 | 1) {
  const j = i + dir;
  if (j < 0 || j >= props.sites.length) return;
  const next = [...props.sites];
  [next[i], next[j]] = [next[j], next[i]];
  void persist(next);
}

function remove(i: number) {
  const s = props.sites[i];
  if (!confirm(`确定删除「${s.name}」吗？`)) return;
  void persist(props.sites.filter((_, idx) => idx !== i));
}
</script>

<template>
  <div class="site-manager">
    <div class="set-row set-actions">
      <button class="btn btn-sm btn-primary" @click="openAdd">+ 添加网站</button>
    </div>

    <p v-if="error" class="error-bar">{{ error }}</p>

    <div v-if="sites.length" class="site-list">
      <div v-for="(site, i) in sites" :key="site.id" class="site-row">
        <SiteIcon :site="site" />
        <div class="site-row-info">
          <div class="site-row-name">{{ site.name }}</div>
          <div class="site-row-url">{{ site.url }}</div>
        </div>
        <span class="site-row-cat">{{ site.category }}</span>
        <div class="site-row-actions">
          <button class="btn btn-sm" :disabled="i === 0 || saving" title="上移" @click="move(i, -1)">↑</button>
          <button class="btn btn-sm" :disabled="i === sites.length - 1 || saving" title="下移" @click="move(i, 1)">
            ↓
          </button>
          <button class="btn btn-sm" :disabled="saving" @click="openEdit(site)">编辑</button>
          <button class="btn btn-sm btn-danger" :disabled="saving" @click="remove(i)">删除</button>
        </div>
      </div>
    </div>
    <p v-else class="set-status">暂无网站，点击「添加网站」创建第一个</p>

    <SiteFormModal
      v-if="showForm"
      :site="editing"
      :category="editing ? '' : (categories[0] ?? '')"
      :categories="categories"
      @save="onSave"
      @close="showForm = false"
    />
  </div>
</template>
