<script setup>
  const props = defineProps({
    lang: { type: String, required: true },
    stopQuery: { type: String, default: '' },
    stops: { type: Array, required: true },
    stopLoading: Boolean,
    stopError: Boolean,
  });
  const emit = defineEmits(['update:stopQuery', 'search', 'select-stop']);
  const t = (tc, en) => (props.lang === 'tc' ? tc : en);
  const name = (s) => (props.lang === 'tc' ? s.name_tc : s.name_en);
</script>

<template>
  <form class="stop-search" @submit.prevent="emit('search')">
    <v-text-field
      :model-value="stopQuery"
      @update:model-value="emit('update:stopQuery', $event || '')"
      :label="t('搜尋車站名稱', 'Search stop name')"
      prepend-inner-icon="mdi-magnify"
      variant="solo"
      flat
      hide-details
    /><v-btn
      type="submit"
      color="primary"
      size="large"
      :loading="stopLoading"
      >{{ t('搜尋', 'Search') }}</v-btn
    >
  </form>
  <div class="section-heading">
    <h2>
      {{ t('巴士車站', 'Bus stops')
      }}<span class="count">{{ stops.length }}</span>
    </h2>
    <span class="muted">{{
      t('最多顯示 60 個結果', 'Showing up to 60 results')
    }}</span>
  </div>
  <section class="results-panel">
    <v-progress-linear
      v-if="stopLoading"
      indeterminate
      color="primary"
    /><v-alert v-if="stopError" type="warning" variant="tonal">{{
      t('未能載入車站，請重試。', 'Unable to load stops. Please try again.')
    }}</v-alert>
    <table>
      <thead>
        <tr>
          <th>{{ t('車站名稱', 'STOP NAME') }}</th>
          <th>{{ t('到站資訊', 'ARRIVALS') }}</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="stop in stops" :key="stop.stop">
          <td>
            <strong>{{ name(stop) }}</strong
            ><small class="direction">{{
              lang === 'tc' ? stop.name_en : stop.name_tc
            }}</small>
          </td>
          <td>
            <v-btn
              variant="tonal"
              append-icon="mdi-arrow-right"
              @click="emit('select-stop', stop)"
              >{{ t('查看', 'View') }}</v-btn
            >
          </td>
        </tr>
      </tbody>
    </table>
    <p v-if="!stopLoading && !stops.length && !stopError" class="empty">
      {{
        t(
          '找不到車站，請試試其他名稱。',
          'No stops found. Try a different name.',
        )
      }}
    </p>
  </section>
</template>
