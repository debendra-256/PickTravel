import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/',
  plugins: [react()],
  // The admin credentials are a `npm run dev` convenience only: vite inlines every
  // VITE_* value into the published bundle, so a build must not carry them.
  ...(command === 'build'
    ? {
        define: {
          'import.meta.env.VITE_ADMIN_USER_ID': 'undefined',
          'import.meta.env.VITE_ADMIN_PASSWORD': 'undefined'
        }
      }
    : {})
}))
