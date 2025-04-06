// useAlertDialog.ts
import type { Component } from 'vue'
import { createSharedComposable } from '@vueuse/core'

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '~/components/ui/alert-dialog'
import { buttonVariants } from '~/components/ui/button'

type ActionType = 'primary' | 'secondary' | 'destructive' | 'cancel'

export interface DialogAction {
  type: ActionType
  label: string
  click?: () => void
  autoClose?: boolean
}

export interface DialogOptions {
  title?: string
  message: string
  actions: DialogAction[]
}

export interface MessageOptions {
  title?: string
  onClose?: () => void
  cancelButton?: boolean
  cancelLabel?: string
  okLabel?: string
}

export interface ConfirmOptions extends MessageOptions {
  onConfirm?: () => void
  onCancel?: () => void
  confirmLabel?: string
}

interface DialogState {
  isOpen: boolean
  component: Component | null
  resolve: ((value: never) => void) | null
  reject: ((reason?: never) => void) | null
}

interface DefaultLabels {
  ok: string
  cancel: string
  confirm: string
}

// Default labels - can be overridden
const defaultLabels = reactive<DefaultLabels>({
  ok: 'OK',
  cancel: 'Cancel',
  confirm: 'Confirm'
})

// Function to set default labels globally
export function setAlertDialogDefaultLabels(labels: Partial<DefaultLabels>): void {
  Object.assign(defaultLabels, labels)
}

const useAlertDialogBase = () => {
  // Try to use i18n if available, otherwise use default labels
  let i18n: never
  try {
    i18n = useI18n()
  } catch (_) {
    // i18n is not available, will use default labels
  }

  // Function to get label from i18n or defaults
  const getLabel = (key: keyof DefaultLabels, fallback?: string): string => {
    if (fallback) return fallback

    // Try to get from i18n first
    if (i18n) {
      const i18nKey = `alertDialog.${key}`
      const translated = i18n.t(i18nKey)
      // If the translation exists and is not the same as the key (indicating no translation found)
      if (translated && translated !== i18nKey) {
        return translated
      }
    }

    // Fall back to reactive defaults
    return defaultLabels[key]
  }

  const state = ref<DialogState>({
    isOpen: false,
    component: null,
    resolve: null,
    reject: null
  })

  const openDialog = (component: Component) => {
    state.value.component = markRaw(component)
    state.value.isOpen = true
  }

  const closeDialog = () => {
    state.value.isOpen = false
    setTimeout(() => {
      state.value.component = null
    }, 300) // Allow time for close animation
  }

  const dialog = (options: DialogOptions) => {
    return new Promise((resolve) => {
      const handleAction = (action: DialogAction) => {
        if (action.click) {
          action.click()
        }
        resolve(action.type)
        if (action.autoClose !== false) {
          closeDialog()
        }
      }

      const component = defineComponent({
        setup() {
          return () => h(
            AlertDialog,
            { open: state.value.isOpen, 'onUpdate:open': (val: boolean) => {
              if (!val) {
                closeDialog()
                resolve('closed')
              }
            }},
            {
              default: () => h(
                AlertDialogContent,
                {},
                {
                  default: () => [
                    h(
                      AlertDialogHeader,
                      {},
                      {
                        default: () => [
                          options.title ? h(AlertDialogTitle, {}, () => options.title) : null,
                          h(AlertDialogDescription, {}, () => options.message)
                        ]
                      }
                    ),
                    h(
                      AlertDialogFooter,
                      {},
                      {
                        default: () => options.actions.map(action => {
                          if (action.type === 'cancel') {
                            return h(
                              AlertDialogCancel,
                              { onClick: () => handleAction(action) },
                              () => action.label
                            )
                          } else {
                            return h(
                              AlertDialogAction,
                              {
                                onClick: () => handleAction(action),
                                class: [
                                  action.type === 'destructive' && buttonVariants({ variant: 'destructive' }),
                                  action.type === 'secondary' && buttonVariants({ variant: 'primary' }),
                                  action.type === 'primary' && buttonVariants({ variant: 'primary' })
                                ]
                              },
                              () => action.label
                            )
                          }
                        })
                      }
                    )
                  ]
                }
              )
            }
          )
        }
      })

      openDialog(component)
    })
  }

  const message = (message: string, options: MessageOptions = {}) => {
    return dialog({
      title: options.title,
      message,
      actions: [
        ...(options.cancelButton ? [{
          type: 'cancel' as ActionType,
          label: options.cancelLabel || getLabel('cancel'),
          click: options.onClose,
          autoClose: true
        }] : []),
        {
          type: 'primary' as ActionType,
          label: options.okLabel || getLabel('ok'),
          click: options.onClose,
          autoClose: true
        }
      ]
    })
  }

  const confirm = (message: string, options: ConfirmOptions = {}) => {
    return new Promise<boolean>((resolve) => {
      dialog({
        title: options.title,
        message,
        actions: [
          {
            type: 'cancel' as ActionType,
            label: options.cancelLabel || getLabel('cancel'),
            click: () => {
              if (options.onCancel) options.onCancel()
              resolve(false)
            },
            autoClose: true
          },
          {
            type: 'primary' as ActionType,
            label: options.confirmLabel || getLabel('confirm'),
            click: () => {
              if (options.onConfirm) options.onConfirm()
              resolve(true)
            },
            autoClose: true
          }
        ]
      })
    })
  }

  return {
    state,
    alert: {
      dialog,
      message,
      confirm,
    },
    // Expose method to set labels for this instance only (not global)
    setLabels: (labels: Partial<DefaultLabels>) => {
      Object.assign(defaultLabels, labels)
    }
  }
}

// Create a shared composable that can be used across components
export const useAlertDialog = createSharedComposable(useAlertDialogBase)

// Helper component that provides the dialog context to the app
export const AlertDialogProvider = defineComponent({
  setup(_, { slots }) {
    const { state } = useAlertDialog()

    return () => h('div', { class: 'alert-dialog-provider' }, [
      slots.default?.(),
      // Create a hidden trigger element to ensure the dialog portal works correctly
      h('div', { style: { display: 'none' } }, [
        state.value.component ? h(state.value.component) : null
      ])
    ])
  }
})