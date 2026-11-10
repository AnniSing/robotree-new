import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  root: './',
  publicDir: 'public',
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
        secure: false
      }
    }
  },
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false,
    minify: 'esbuild',
    target: 'es2020',
    cssMinify: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        about: resolve(__dirname, 'about.html'),
        team: resolve(__dirname, 'team.html'),
        courses: resolve(__dirname, 'courses.html'),
        services: resolve(__dirname, 'services.html'),
        gallery: resolve(__dirname, 'gallery.html'),
        certificate: resolve(__dirname, 'certificate.html'),
        contact: resolve(__dirname, 'contact.html'),
        admin: resolve(__dirname, 'admin.html'),
        employee: resolve(__dirname, 'employee.html'),
        employeeLogin: resolve(__dirname, 'employee-login.html'),
        store: resolve(__dirname, 'store.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html')
      }
    }
  }
});
