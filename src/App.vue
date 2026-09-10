<script setup>
  import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
  import Topbar from './components/Topbar.vue';
  import LiveComponent from './components/LiveComponent.vue';
  import StopsComponent from './components/StopsComponent.vue';
  import SettingsComponent from './components/SettingsComponent.vue';
  import ButtomMenu from './components/ButtomMenu.vue';
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
    <Topbar v-model:lang="lang" v-model:large="large" />
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
      <LiveComponent
        v-if="page === 'live'"
        v-model:query="query"
        :lang="lang"
        :routes="routes"
        :selected="selected"
        :loading="loading"
        :error="error"
        :updated="updated"
        :now="now"
        @change-stop="page = 'stops'"
        @refresh="refresh"
      />
      <StopsComponent
        v-else-if="page === 'stops'"
        v-model:stop-query="stopQuery"
        :lang="lang"
        :stops="stops"
        :stop-loading="stopLoading"
        :stop-error="stopError"
        @search="searchStops"
        @select-stop="selectStop"
      />
      <SettingsComponent v-else :lang="lang" />
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
    <ButtomMenu v-model:page="page" :lang="lang" />
  </v-app>
</template>
