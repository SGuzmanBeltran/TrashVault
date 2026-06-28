import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { setTwoFactorRedirectHandler } from './lib/auth-client'
import './styles/main.css'

setTwoFactorRedirectHandler(() => {
  router.push({ name: 'two-factor' })
})

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')
