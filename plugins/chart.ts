import type { App } from 'vue'

import { Chart as ChartJS } from 'chart.js'

export function installChart(_app: App) {
  ChartJS.defaults.animation = false
}
