import tailwindcss from '@tailwindcss/vite'
import svgLoader from 'vite-svg-loader'


// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-22',
  components: {
    dirs: []
  },

  future: {
    compatibilityVersion: 4,
  },

  devtools: {
    enabled: false
  },

  modules: [
    '@nuxt/eslint',
    '@nuxt/icon',
    '@nuxt/image',
    'nuxt-i18n-micro',
  ],

  image: {
    provider: 'ilum',
    providers: {
      ilum: {
        name: 'ilum',
        provider: '~/lib/providers/ilum',
        options: {
          baseURL: process.env.NUXT_ILUM_BASE_URL
        }
      }
    }
  },

  runtimeConfig: {
    public: {
      posthog: {
        key: process.env.NUXT_PUBLIC_POSTHOG_KEY,
        host: process.env.NUXT_PUBLIC_POSTHOG_HOST,
      },
      echo: {
        broadcaster: 'reverb',
        key: process.env.NUXT_PUBLIC_REVERB_APP_KEY,
        wsHost: process.env.NUXT_PUBLIC_REVERB_HOST,
        wsPort: process.env.NUXT_PUBLIC_REVERB_PORT,
        wssPort: process.env.NUXT_PUBLIC_REVERB_PORT,
        forceTLS: (process.env.NUXT_PUBLIC_REVERB_SCHEME ?? 'https') === 'https',
        enabledTransports: ['ws', 'wss'],
      },
    },
  },

  nitro: {
    inlineDynamicImports: true,
    prerender: {
      failOnError: false,
    },
    devProxy: {
      '/auth': { target: `${process.env.NUXT_API_PROXY_URL}auth`, changeOrigin: true },
      '/mgmt/v1': { target: `${process.env.NUXT_API_PROXY_URL}mgmt/v1`, changeOrigin: true },
      '/api/v1': { target: `${process.env.NUXT_API_PROXY_URL}api/v1`, changeOrigin: true },
    }
  },

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: false,
  },

  router: {
    options: {
      scrollBehaviorType: 'smooth',
    }
  },

  icon: {
    size: '1rem',
    mode: 'svg',
    collections: ['lucide', 'flag'],
    customCollections: [
      {
        prefix: 'b10cks',
        dir: './assets/icons'
      },
    ],
  },

  i18n: {
    strategy: 'no_prefix',
    defaultLocale: 'en',
    fallbackLocale: 'en',
    translationDir: 'i18n',
    lazy: true,
    define: false,
    disablePageLocales: true,
    locales: [
      { code: 'de', name: 'Deutsch', iso: 'de', file: 'de.json' },
      { code: 'en', name: 'English', iso: 'en', file: 'en.json' },
    ],
  },

  vite: {
    plugins: [svgLoader({
        svgoConfig: {
          plugins: [
            {
              name: 'preset-default',
              params: {
                overrides: {
                  // customize default plugin options
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
      tailwindcss()
    ],
  },
})