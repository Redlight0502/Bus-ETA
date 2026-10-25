<script setup>
  const props = defineProps({
    lang: { type: String, required: true },
    query: { type: String, default: '' },
    routes: { type: Array, required: true },
    selected: { type: Object, required: true },
    loading: Boolean,
    error: Boolean,
    updated: { type: Date, default: null },
    now: { type: Number, required: true },
  });
  const emit = defineEmits(['update:query', 'change-stop', 'refresh']);
  const t = (tc, en) => (props.lang === 'tc' ? tc : en);
  const name = (s) => (props.lang === 'tc' ? s.name_tc : s.name_en);
  const minutes = (eta) =>
    Math.max(0, Math.ceil((Date.parse(eta) - props.now) / 60000));
</script>

<template>
  <v-text-field
    :model-value="query"
    @update:model-value="emit('update:query', $event || '')"
    class="search"
    :label="t('搜尋路線或目的地', 'Search route or destination')"
    prepend-inner-icon="mdi-magnify"
    variant="solo"
    flat
    hide-details
    clearable
    @click:clear="emit('update:query', '')"
  />
  <div class="section-heading">
    <h2>
      {{ t('即時到站', 'Live arrivals')
      }}<span class="count">{{ routes.length }}</span>
    </h2>
    <div class="live-tag">
      <i></i>{{ t('每 30 秒更新', 'Updates every 30s') }}
    </div>
  </div>
  <section class="results-panel">
    <div class="stop-heading">
      <div class="stop-label">
        <span class="stop-icon"><v-icon>mdi-map-marker-outline</v-icon></span>
        <div>
          <small>{{ t('目前車站', 'CURRENT STOP') }}</small>
          <h3>{{ name(selected) }}</h3>
        </div>
      </div>
      <v-btn
        variant="text"
        append-icon="mdi-arrow-right"
        @click="emit('change-stop')"
        >{{ t('更改車站', 'Change stop') }}</v-btn
      >
    </div>
    <v-progress-linear v-if="loading" indeterminate color="primary" />
    <v-alert v-if="error" type="warning" variant="tonal" class="ma-4"
      >{{
        t(
          '暫時未能更新巴士資料，請稍後重試。',
          'Bus data could not be updated. Please try again.',
        )
      }}<v-btn variant="text" @click="emit('refresh')">{{
        t('重試', 'Retry')
      }}</v-btn></v-alert
    >
    <div class="table-scroll">
      <table>
        <thead>
          <tr>
            <th>{{ t('路線', 'ROUTE') }}</th>
            <th>{{ t('目的地', 'DESTINATION') }}</th>
            <th class="arrival-column">
              {{ t('預計到站', 'NEXT ARRIVALS') }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="bus in routes" :key="bus.key">
            <td>
              <span class="route-number">{{ bus.route }}</span
              ><small class="operator">{{ t('九巴', 'KMB') }}</small>
            </td>
            <td>
              <span class="destination">{{
                lang === 'tc' ? bus.dest_tc : bus.dest_en
              }}</span
              ><small class="direction"
                >{{ t('往', 'Towards') }}
                {{ lang === 'tc' ? bus.dest_en : bus.dest_tc }}</small
              >
            </td>
            <td class="arrival-column">
              <div v-if="bus.times.length" class="etas">
                <span
                  v-for="(eta, index) in bus.times"
                  :key="eta"
                  :class="['eta', { first: index === 0 }]"
                  ><strong>{{
                    minutes(eta) === 0 ? t('即將', 'Due') : minutes(eta)
                  }}</strong
                  ><small v-if="minutes(eta) > 0">{{
                    t('分鐘', 'min')
                  }}</small></span
                >
              </div>
              <span v-else class="muted">{{
                t('暫無預報', 'No estimate')
              }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="!loading && !routes.length && !error" class="empty">
      <v-icon size="36">mdi-bus-clock</v-icon>
      <p>
        {{
          t(
            '暫無符合的路線，試試其他搜尋。',
            'No matching routes. Try another search.',
          )
        }}
      </p>
    </div>
    <div class="panel-footer">
      <span
        ><v-icon size="15">mdi-clock-outline</v-icon>
        {{
          updated
            ? t('最後更新 ', 'Updated ') +
              updated.toLocaleTimeString(lang === 'tc' ? 'zh-HK' : 'en-GB')
            : t('等待巴士資料', 'Waiting for bus data')
        }}
        {{
          error && updated
            ? t('（資料可能已過時）', '(may be out of date)')
            : ''
        }}</span
      ><v-btn
        variant="text"
        size="small"
        prepend-icon="mdi-refresh"
        :loading="loading"
        @click="emit('refresh')"
        >{{ t('重新整理', 'Refresh') }}</v-btn
      >
    </div>
  </section>
  <div class="tip">
    <v-icon size="20">mdi-lightbulb-outline</v-icon
    ><span
      >{{ t('出門小提示', 'A little travel tip')
      }}<small>{{
        t(
          '到站時間僅供參考，建議提早到達車站。',
          'Arrival times are estimates. Give yourself a little extra time.',
        )
      }}</small></span
    >
  </div>
</template>
