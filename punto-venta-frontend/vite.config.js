// Archivo: punto-venta-frontend/vite.config.js

import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'; // <--- REQUIERE ESTA IMPORTACIÓN

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      // Define el alias @ para que apunte a la carpeta src
      { find: '@', replacement: path.resolve(__dirname, './src') }, 
    ],
  },
})