import { defineConfig } from 'vite';
import eslintPlugin from '@nabla/vite-plugin-eslint';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react-swc';
import path from 'path';

export default defineConfig({
  plugins: [react(), eslintPlugin(), basicSsl()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
