import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  base: '/touchfish-extended-configurator/',
  test: {
    environment: 'node',
  },
})
