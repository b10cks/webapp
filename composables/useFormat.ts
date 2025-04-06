import dayjs from 'dayjs'
import LocalizedFormat from 'dayjs/plugin/localizedFormat'
import RelativeTime from 'dayjs/plugin/relativeTime'
import Calendar from 'dayjs/plugin/calendar'
import UpdateLocale from 'dayjs/plugin/updateLocale'

export default function useFormat() {
  dayjs.extend(LocalizedFormat)
  dayjs.extend(RelativeTime)
  dayjs.extend(Calendar)
  dayjs.extend(UpdateLocale)

  // Configure calendar display options
  dayjs.updateLocale('en', {
    calendar: {
      lastDay: '[Yesterday at] LT',
      sameDay: '[Today at] LT',
      nextDay: '[Tomorrow at] LT',
      lastWeek: '[Last] dddd [at] LT',
      nextWeek: 'dddd [at] LT',
      sameElse: 'LL'
    }
  })

  const { getLocale } = useI18n()
  const locale = ref(getLocale())

  function formatDateTime(date: string | Date | number, format: string = 'LLL') {
    return dayjs(date).locale(locale.value).format(format)
  }

  function formatRelativeTime(date: string | Date | number) {
    return dayjs(date).locale(locale.value).fromNow()
  }

  function formatCalendarTime(date: string | Date | number) {
    return dayjs(date).locale(locale.value).calendar()
  }

  function formatVersionTime(date: string | Date | number, group: 'today' | 'yesterday' | 'thisWeek' | 'lastWeek' | 'older') {
    switch (group) {
      case 'today':
      case 'yesterday':
        return dayjs(date).locale(locale.value).format('HH:mm')
      case 'thisWeek':
      case 'lastWeek':
        return dayjs(date).locale(locale.value).format('ddd HH:mm')
      case 'older':
        return dayjs(date).locale(locale.value).format('MMM D, YYYY')
      default:
        return dayjs(date).locale(locale.value).format('LLL')
    }
  }

  function formatCurrency(value: number, currency: string, options: Intl.NumberFormatOptions = {}) {
    return new Intl.NumberFormat(locale.value, {
      style: 'currency',
      currency,
      ...options,
    }).format(value)
  }

  function formatDuration(milliseconds: number, decimals: number = 0, unit: 'ms' | 's' = 'ms'): string {
    if (milliseconds === 0) return `0 ${unit}`

    // If unit is seconds, convert milliseconds to seconds
    const value = unit === 's' ? milliseconds / 1000 : milliseconds

    return new Intl.NumberFormat(locale.value, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
    }).format(value) + ` ${unit}`
  }

  function formatNumber(value: number, decimals: number = 0, options: Intl.NumberFormatOptions = {}): string {
    return new Intl.NumberFormat(locale.value, {
      maximumFractionDigits: decimals,
      minimumFractionDigits: decimals,
      ...options,
    }).format(value)
  }

  function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B'

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))

    return new Intl.NumberFormat(locale.value, {
      maximumFractionDigits: i === 0 ? 0 : 1,
      minimumFractionDigits: i === 0 ? 0 : 1,
    }).format(bytes / Math.pow(1024, i)) + ' ' + units[i]
  }

  return {
    formatDateTime,
    formatFileSize,
    formatCurrency,
    formatVersionTime,
    formatRelativeTime,
    formatCalendarTime,
    formatDuration,
    formatNumber,
  }
}