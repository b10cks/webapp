import { createApp } from 'vue'

import App from '~/App.vue'
import { isClient } from '~/lib/env'
import { installChart } from '~/plugins/chart'
import { installEcho } from '~/plugins/echo'
import { installI18n } from '~/plugins/i18n'
import { installVueQuery } from '~/plugins/vue-query'
import { router } from '~/router'
import '~/assets/css/main.css'

const app = createApp(App)

installI18n(app)
installVueQuery(app)
installChart(app)

app.use(router)

app.mount('#app')

if (isClient) {
  installEcho(app)
}
