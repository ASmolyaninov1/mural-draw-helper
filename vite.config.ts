import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import TsconfigPaths from 'vite-tsconfig-paths'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/dist',
  plugins: [react(), TsconfigPaths()]
})
