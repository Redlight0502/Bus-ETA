import { createApp } from 'vue';
import { createVuetify } from 'vuetify';
import * as components from 'vuetify/components';
import * as directives from 'vuetify/directives';
import 'vuetify/styles';
import '@mdi/font/css/materialdesignicons.css';
import App from './App.vue';
import './style.css';
createApp(App).use(createVuetify({ components, directives, theme: { defaultTheme: 'light', themes: { light: { colors: { primary: '#FFD138', background: '#F7F8FA', surface: '#FFFFFF' } } } }, defaults: { VBtn: { style: 'text-transform: none; letter-spacing: 0', rounded: 'lg', elevation: 0 } } })).mount('#app');
