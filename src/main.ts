import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import { applyDocument } from './i18n'

// İlk açılışta <html lang> ve sekme başlığını etkin dile göre ayarla.
applyDocument()

createApp(App).mount('#app')
