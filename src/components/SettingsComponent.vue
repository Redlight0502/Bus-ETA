<script setup>
  const props = defineProps({ lang: { type: String, required: true } });
  const t = (tc, en) => (props.lang === 'tc' ? tc : en);
</script>

<template>
  <section class="results-panel settings empty">
    <span class="settings-icon"
      ><v-icon size="38">mdi-tune-variant</v-icon></span
    >
    <h2>{{ t('設定', 'Settings') }}</h2>
    <p>
      {{
        t(
          '更多個人化設定，即將推出。',
          'More ways to make it yours. Coming soon.',
        )
      }}
    </p>
    <v-chip color="primary" variant="flat">{{
      t('敬請期待', 'Stay tuned')
    }}</v-chip>
  </section>
</template>
