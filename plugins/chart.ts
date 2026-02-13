import { Chart as ChartJS } from 'chart.js'
import type { App } from 'vue'

export function installChart(_app: App) {
  ChartJS.defaults.animation = false
}
