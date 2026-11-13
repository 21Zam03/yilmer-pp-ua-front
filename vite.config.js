import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import fs from 'fs'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {

  const envConfig = JSON.parse(
    fs.readFileSync(`./config/${mode}.json`, 'utf-8')
  )

  return {
    plugins: [
      vue(),
      tailwindcss(),
    ],

    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url))
      },
    },

    define: {
      __API_BASE_URL__: JSON.stringify(envConfig.API_BASE_URL)
    }
  }
})
