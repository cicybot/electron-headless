import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3455,
      host: '0.0.0.0',
      allowedHosts: ['ga-win-3455.cicy.de5.net', 'localhost', '127.0.0.1'],
      strictPort: true, // Don't try other ports if 3455 is occupied
    },
    logLevel: 'info', // Enable verbose logging
    clearScreen: false, // Keep logs visible
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      }
    }
  };
});
