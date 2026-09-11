# Bus Daily / 巴士日常

Vue 3 + Vuetify Material Design frontend, with a Node.js / Express API. Theme: #FFD138. Traditional Chinese and English, persistent text-size preference, live arrivals, stop search, and a settings placeholder.

## Run

Requires Node.js 22 and npm.

```sh
npm install
npm run build
npm start
```

Open http://localhost:3000. The server serves both the built Vue app and API. Set PORT to use another port.

For development, run `npm run api` and `npm run dev` in separate terminals. Vite proxies /api to port 3000.

## API

- GET /api/health
- GET /api/arrivals?stop=6E6EBC9D1AF2DA52
- GET /api/stops?q=沙田 (up to 60 matching stops)

Data comes from https://data.etabus.gov.hk/v1/transport/kmb. This initial version supports KMB only. Arrival data is cached for 30 seconds, stop metadata for 24 hours. Provider failures return HTTP 502; no simulated arrival times are shown. The default stop is Yat King House from the original project. Temperature is fixed at 28°C as requested.

Original HTML, JavaScript and CSS are preserved in legacy/. The Vue frontend is in src/; server.js is the Node API and production web server. Vue is a frontend framework; Express handles the HTTP API.

## Open data APIs

### return the route list
https://data.etabus.gov.hk/v1/transport/kmb/route/
'''
{
  "type": "RouteList",
  "version": "1.0",
  "generated_timestamp": "2026-09-11T19:37:32+08:00",
  "data": [
    {
      "route": "1",
      "bound": "O",
      "service_type": "1",
      "orig_en": "CHUK YUEN ESTATE",
      "orig_tc": "竹園邨",
      "orig_sc": "竹园邨",
      "dest_en": "STAR FERRY",
      "dest_tc": "尖沙咀碼頭",
      "dest_sc": "尖沙咀码头"
    },
    ...
  ]
}
'''

### return stop list and its details
https://data.etabus.gov.hk/v1/transport/kmb/stop
'''
{
  "type": "StopList",
  "version": "1.0",
  "generated_timestamp": "2026-09-11T19:38:00+08:00",
  "data": [
    {
      "stop": "18492910339410B1",
      "name_en": "CHUK YUEN ESTATE BUS TERMINUS (WT916)",
      "name_tc": "竹園邨總站 (WT916)",
      "name_sc": "竹园邨总站 (WT916)",
      "lat": "22.345415",
      "long": "114.192640"
    },
    ...
  ]
}
'''
### return stop
tell which bus will stop at this stop
https://data.etabus.gov.hk/v1/transport/kmb/route-stop

'''
{
  "type": "RouteStopList",
  "version": "1.0",
  "generated_timestamp": "2026-09-11T19:38:42+08:00",
  "data": [
    {
      "route": "1",
      "bound": "O",
      "service_type": "1",
      "seq": "1",
      "stop": "18492910339410B1"
    },
    ...
  ]
}
'''

### ETA of a route at a stop
https://data.etabus.gov.hk/v1/transport/kmb/eta/{bus_stop_id}/{route}/{service_type}

https://data.etabus.gov.hk/v1/transport/kmb/eta/8F8F2B65EFDC48FD/74A/1
'''
{
  "type": "ETA",
  "version": "1.0",
  "generated_timestamp": "2026-09-11T21:08:43+08:00",
  "data": [
    {
      "co": "KMB",
      "route": "74A",
      "dir": "I",
      "service_type": 1,
      "seq": 15,
      "dest_tc": "大埔(太和)",
      "dest_sc": "大埔(太和)",
      "dest_en": "TAI PO (TAI WO)",
      "eta_seq": 1,
      "eta": "2026-09-11T22:03:12+08:00",
      "rmk_tc": "原定班次",
      "rmk_sc": "原定班次",
      "rmk_en": "Scheduled Bus",
      "data_timestamp": "2026-09-11T21:08:11+08:00"
    }
  ]
}
'''


### route ETA
https://data.etabus.gov.hk/v1/transport/kmb/route-eta/74A/1
'''
{
  "type": "RouteETA",
  "version": "1.0",
  "generated_timestamp": "2026-09-11T21:29:17+08:00",
  "data": [
    {
      "co": "KMB",
      "route": "74A",
      "dir": "O",
      "service_type": 1,
      "seq": 1,
      "dest_tc": "啟業",
      "dest_sc": "启业",
      "dest_en": "KAI YIP",
      "eta_seq": 1,
      "eta": "2026-09-11T22:00:00+08:00",
      "rmk_tc": "最後班次",
      "rmk_sc": "最后班次",
      "rmk_en": "Final Bus",
      "data_timestamp": "2026-09-11T21:29:14+08:00"
    },
    ...
  ]
}
'''