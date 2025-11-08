import { Chart as ChartJS } from 'chart.js'

export default defineNuxtPlugin(() => {
  ChartJS.defaults.animation = false
})
