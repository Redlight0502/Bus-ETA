<script setup>
  const props = defineProps({
    lang: { type: String, required: true },
    page: { type: String, required: true },
  });
  const emit = defineEmits(['update:page']);
  const t = (tc, en) => (props.lang === 'tc' ? tc : en);
</script>

<template>
  <nav class="bottom-nav" :aria-label="t('主要導覽', 'Main navigation')">
    <div>
      <button
        v-for="item in [
          { id: 'live', icon: 'mdi-bus-clock', tc: '即時', en: 'Live' },
          {
            id: 'stops',
            icon: 'mdi-map-marker-outline',
            tc: '查站',
            en: 'Stops',
          },
          {
            id: 'settings',
            icon: 'mdi-tune-variant',
            tc: '設定',
            en: 'Settings',
          },
        ]"
        :key="item.id"
        :class="{ active: page === item.id }"
        :aria-current="page === item.id ? 'page' : undefined"
        @click="emit('update:page', item.id)"
      >
        <span class="nav-icon"
          ><v-icon>{{ item.icon }}</v-icon></span
        ><span>{{ t(item.tc, item.en) }}</span>
      </button>
    </div>
  </nav>
</template>
