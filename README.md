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
