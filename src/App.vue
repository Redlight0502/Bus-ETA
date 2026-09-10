<script setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  const lang = ref(localStorage.getItem('bus-language') || 'tc');
  const large = ref(localStorage.getItem('bus-large') === 'true');
  const page = ref('live');
  const query = ref('');
  const stopQuery = ref('');
  const arrivals = ref([]),
    stops = ref([]),
    loading = ref(false),
    stopLoading = ref(false),
    error = ref(false),
    stopError = ref(false),
    updated = ref(null),
    now = ref(Date.now());
  const selected = ref({
    stop: '6E6EBC9D1AF2DA52',
    name_tc: '日景樓',
    name_en: 'YAT KING HOUSE',
  });
  const t = (tc, en) => (lang.value === 'tc' ? tc : en);
  const name = (s) => (lang.value === 'tc' ? s.name_tc : s.name_en);
  watch(
    lang,
    (value) => {
      localStorage.setItem('bus-language', value);
      document.documentElement.lang = value === 'tc' ? 'zh-HK' : 'en';
    },
    { immediate: true },
  );
  watch(large, (value) => localStorage.setItem('bus-large', value));
  const routes = computed(() => {
    const groups = new Map();
    for (const bus of arrivals.value) {
      const key = `${bus.route}-${bus.dir}-${bus.service_type}`;
      if (!groups.has(key)) groups.set(key, { ...bus, key, times: [] });
      if (bus.eta && Date.parse(bus.eta) >= now.value - 60000)
        groups.get(key).times.push(bus.eta);
    }
    return [...groups.values()]
      .filter((b) =>
        `${b.route} ${b.dest_tc} ${b.dest_en}`
          .toLowerCase()
          .includes((query.value || '').toLowerCase()),
      )
      .map((b) => ({ ...b, times: [...new Set(b.times)].sort().slice(0, 3) }))
      .sort((a, b) =>
        a.route.localeCompare(b.route, undefined, { numeric: true }),
      );
  });
  const minutes = (eta) =>
    Math.max(0, Math.ceil((Date.parse(eta) - now.value) / 60000));
  let request = 0;
  async function refresh() {
    const id = ++request;
    loading.value = true;
    error.value = false;
    try {
      const response = await fetch(`/api/arrivals?stop=${selected.value.stop}`);
      if (!response.ok) throw new Error();
      const body = await response.json();
      if (id === request) {
        arrivals.value = body.data;
        updated.value = new Date(body.updatedAt);
      }
    } catch {
      if (id === request) error.value = true;
    } finally {
      if (id === request) loading.value = false;
    }
  }
  async function searchStops() {
    stopLoading.value = true;
    stopError.value = false;
    try {
      const response = await fetch(
        `/api/stops?q=${encodeURIComponent(stopQuery.value)}`,
      );
      if (!response.ok) throw new Error();
      stops.value = (await response.json()).data;
    } catch {
      stopError.value = true;
      stops.value = [];
    } finally {
      stopLoading.value = false;
    }
  }
  function selectStop(stop) {
    selected.value = stop;
    arrivals.value = [];
    updated.value = null;
    query.value = '';
    page.value = 'live';
    refresh();
  }
  watch(page, (p) => {
    if (p === 'stops' && !stops.value.length) searchStops();
  });
  let poll, clock;
  onMounted(() => {
    refresh();
    poll = setInterval(refresh, 30000);
    clock = setInterval(() => (now.value = Date.now()), 1000);
  });
  onUnmounted(() => {
    clearInterval(poll);
    clearInterval(clock);
  });
</script>

<template>
  <v-app :class="{ 'large-text': large }">
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
            @click="lang = lang === 'tc' ? 'en' : 'tc'"
            >繁 / EN</v-btn
          ><v-btn
            class="font-toggle"
            variant="outlined"
            :aria-pressed="large"
            @click="large = !large"
            ><span class="aa">Aa</span
            >{{
              large ? t('標準字體', 'Normal text') : t('大字模式', 'Large text')
            }}</v-btn
          >
        </div>
      </div>
    </header>
    <main class="main">
      <div class="brand">
        <span class="brand-icon"><v-icon>mdi-bus</v-icon></span
        ><span
          >{{ t('巴士日常', 'Bus Daily')
          }}<small>HONG KONG BUS COMPANION</small></span
        >
      </div>
      <section class="intro">
        <div>
          <div class="eyebrow">
            {{
              t('每一程，都心中有數', 'A LITTLE CERTAINTY FOR EVERY JOURNEY')
            }}
          </div>
          <h1>
            {{
              page === 'live'
                ? t('下一班，幾時到？', 'Your next bus, at a glance.')
                : page === 'stops'
                  ? t('搵一個站，開始旅程。', 'Find your next stop.')
                  : t('你的日常，由你設定。', 'Make yourself at home.')
            }}
          </h1>
          <p>
            {{
              t(
                '輕鬆掌握巴士動態，出門從容一點。',
                'Less waiting. More living. Know before you go.',
              )
            }}
          </p>
        </div>
        <div class="journey-art" aria-hidden="true">
          <span class="art-sun"></span><v-icon>mdi-bus-side</v-icon
          ><span class="art-road"></span><span class="art-dot"></span>
        </div>
      </section>
      <template v-if="page === 'live'">
        <v-text-field
          v-model="query"
          class="search"
          :label="t('搜尋路線或目的地', 'Search route or destination')"
          prepend-inner-icon="mdi-magnify"
          variant="solo"
          flat
          hide-details
          clearable
          @click:clear="query = ''"
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
              <span class="stop-icon"
                ><v-icon>mdi-map-marker-outline</v-icon></span
              >
              <div>
                <small>{{ t('目前車站', 'CURRENT STOP') }}</small>
                <h3>{{ name(selected) }}</h3>
              </div>
            </div>
            <v-btn
              variant="text"
              append-icon="mdi-arrow-right"
              @click="page = 'stops'"
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
            }}<v-btn variant="text" @click="refresh">{{
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
                    updated.toLocaleTimeString(
                      lang === 'tc' ? 'zh-HK' : 'en-GB',
                    )
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
              @click="refresh"
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
      <template v-else-if="page === 'stops'">
        <form class="stop-search" @submit.prevent="searchStops">
          <v-text-field
            v-model="stopQuery"
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
            t(
              '未能載入車站，請重試。',
              'Unable to load stops. Please try again.',
            )
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
                    @click="selectStop(stop)"
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
      <section v-else class="results-panel settings empty">
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
      <footer class="source">
        <span>{{
          t('為香港每一程而設', 'Made for everyday journeys in Hong Kong')
        }}</span
        ><span
          >{{ t('資料來源：九巴開放數據', 'Source: KMB Open Data') }}
          <v-icon size="13">mdi-arrow-top-right</v-icon></span
        >
      </footer>
    </main>
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
          @click="page = item.id"
        >
          <span class="nav-icon"
            ><v-icon>{{ item.icon }}</v-icon></span
          ><span>{{ t(item.tc, item.en) }}</span>
        </button>
      </div>
    </nav>
  </v-app>
</template>
