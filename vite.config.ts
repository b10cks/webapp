import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import AutoImport from 'unplugin-auto-import/vite'
import Components from 'unplugin-vue-components/vite'
import { defineConfig, loadEnv } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'
import svgLoader from 'vite-svg-loader'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_APP_')
  const apiProxyUrl = env.VITE_APP_API_PROXY_URL || 'http://localhost:8000'

  return {
    plugins: [
      AutoImport({
        imports: [
          'vue',
          'vue-router',
          {
            '~/env': ['useRuntimeConfig'],
          },
        ],
        dts: 'auto-imports.d.ts',
        dirs: ['composables', 'plugins'],
        vueTemplate: true,
      }),
      Components({
        dirs: ['components'],
        dts: 'components.d.ts',
        deep: true,
        extensions: ['vue'],
      }),
      vue(),
      tailwindcss(),
      svgLoader({
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  inlineStyles: {
                    onlyMatchedOnce: false,
                  },
                  removeViewBox: false,
                  convertShapeToPath: false,
                  mergePaths: false,
                },
              },
            },
            {
              name: 'removeAttrs',
              params: {
                attrs: 'data-name',
              },
            },
            {
              name: 'convertStyleToAttrs',
            },
          ],
        },
      }),
      VitePWA({
        registerType: 'autoUpdate',
        workbox: {
          navigateFallback: '/',
          globPatterns: ['assets/**/*.{js,css}', '**/*.html', '**/*.png', '**/*.svg', '**/*.ico'],
        },
        devOptions: {
          enabled: true,
          type: 'module',
        },
        manifest: {
          name: 'b10cks CMS',
          short_name: 'b10cks',
          description: 'b10cks – the opinionated headless cms',
          theme_color: '#ffffff',
          background_color: '#0B0B0F',
          display: 'standalone',
          start_url: '/',
          icons: [
            {
              src: '/web-app-manifest-192x192.png',
              sizes: '192x192',
              type: 'image/png',
            },
            {
              src: '/web-app-manifest-512x512.png',
              sizes: '512x512',
              type: 'image/png',
            },
          ],
        },
      }),
    ],
    resolve: {
      alias: {
        '~': resolve(__dirname, '.'),
        '@': resolve(__dirname, '.'),
      },
    },
    css: {
      devSourcemap: true,
    },
    server: {
      port: 3000,
      https: {
        key: './localhost.key',
        cert: './localhost.crt',
      },
      proxy: {
        '/auth': {
          target: apiProxyUrl,
          changeOrigin: true,
          headers: { 'accept-encoding': 'identity' },
        },
        '/mgmt/v1': {
          target: apiProxyUrl,
          changeOrigin: true,
          headers: { 'accept-encoding': 'identity' },
        },
        '/sanctum': {
          target: apiProxyUrl,
          changeOrigin: true,
          headers: { 'accept-encoding': 'identity' },
        },
        '/api/v1': {
          target: apiProxyUrl,
          changeOrigin: true,
          headers: { 'accept-encoding': 'identity' },
        },
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
    },
    define: {
      __DEV__: JSON.stringify(process.env.NODE_ENV !== 'production'),
    },
  }
})
