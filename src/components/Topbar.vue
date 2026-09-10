<script setup>
  const props = defineProps({
    lang: { type: String, required: true },
    large: Boolean,
  });
  const emit = defineEmits(['update:lang', 'update:large']);
  const t = (tc, en) => (props.lang === 'tc' ? tc : en);
</script>

<template>
  <header class="topbar">
    <div class="topbar-inner">
      <div class="weather">
        <v-icon size="19">mdi-map-marker-outline</v-icon
        ><strong>{{ t('香港', 'Hong Kong') }}</strong
        ><span class="divider"></span
        ><v-icon size="22">mdi-weather-partly-cloudy</v-icon
        ><span>28°<span class="temperature-unit">C</span></span>
      </div>
      <div class="header-actions">
        <v-btn
          variant="text"
          size="small"
          :aria-label="t('切換至英文', 'Switch to Traditional Chinese')"
          @click="emit('update:lang', lang === 'tc' ? 'en' : 'tc')"
          >繁 / EN</v-btn
        ><v-btn
          class="font-toggle"
          variant="outlined"
          :aria-pressed="large"
          @click="emit('update:large', !large)"
          ><span class="aa">Aa</span
          >{{
            large ? t('標準字體', 'Normal text') : t('大字模式', 'Large text')
          }}</v-btn
        >
      </div>
    </div>
  </header>
</template>
