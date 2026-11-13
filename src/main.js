import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router'
import { createPinia } from 'pinia'

import { createVuetify } from 'vuetify'
import 'vuetify/styles'
import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'

const vuetify = createVuetify({
    components,
    directives,
    theme: {
        defaultTheme: 'miTema',
        themes: {
            miTema: {
                dark: false,
                colors: {
                    sidemenucolor: '#ffffff',
                    backgroundcolor: '#2563EB',
                    secondBackgroundcolor: '#ffffff',
                    thirdBackgroundColor: '#FFFFFF'
                }
            }
        }
    },
})

const pinia = createPinia()

const app = createApp(App);
app.use(router)
app.use(vuetify)
app.use(pinia)
app.mount('#app')
