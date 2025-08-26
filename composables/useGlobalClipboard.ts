import { toast } from 'vue-sonner'
import { useClipboard, useLocalStorage } from '@vueuse/core'

export interface ClipboardItem {
  type: 'blocks-editor-clipboard-item'
  data: Record<string, unknown>
  timestamp: number
  spaceId: string
  blockType?: string
}

const { copy: copyToClipboard, text: clipboardText } = useClipboard({ read: true })
const localStorageClipboard = useLocalStorage<string | null>('blocks-clipboard', null)
const ulid = useUlid()

export const useGlobalClipboard = () => {
  // Fallback storage for when clipboard API isn't available or fails

  const replaceIds = (obj: unknown): unknown => {
    if (Array.isArray(obj)) {
      return obj.map(replaceIds)
    } else if (obj && typeof obj === 'object') {
      const newObj: Record<string, unknown> = {}
      for (const key in obj as Record<string, unknown>) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          if (key === 'id') {
            newObj[key] = ulid()
          } else {
            newObj[key] = replaceIds((obj as Record<string, unknown>)[key])
          }
        }
      }
      return newObj
    }
    return obj
  }

  const copyItem = async (item: Record<string, unknown>, spaceId: string, blockType?: string) => {
    const clipboardItem: ClipboardItem = {
      type: 'blocks-editor-clipboard-item',
      data: { ...item },
      timestamp: Date.now(),
      spaceId,
      blockType
    }

    const serializedItem = JSON.stringify(clipboardItem)

    try {
      // Try to copy to system clipboard first
      await copyToClipboard(serializedItem)
      // Also store in localStorage as backup
      localStorageClipboard.value = serializedItem

      toast.success('Item copied to clipboard', {
        description: `${blockType || 'Block'} copied successfully`
      })
    } catch (error) {
      // Fallback to localStorage only
      localStorageClipboard.value = serializedItem
      toast.success('Item copied', {
        description: `${blockType || 'Block'} copied (using local storage)`
      })
      // eslint-disable-next-line no-console
      console.warn('Failed to copy to system clipboard, using localStorage:', error)
    }
  }

  const cutItem = async (item: Record<string, unknown>, spaceId: string, blockType?: string) => {
    const clipboardItem: ClipboardItem = {
      type: 'blocks-editor-clipboard-item',
      data: { ...item, _isCut: true }, // Mark as cut
      timestamp: Date.now(),
      spaceId,
      blockType
    }

    const serializedItem = JSON.stringify(clipboardItem)

    try {
      await copyToClipboard(serializedItem)
      localStorageClipboard.value = serializedItem

      toast.success('Item cut to clipboard', {
        description: `${blockType || 'Block'} cut successfully`
      })
    } catch (error) {
      localStorageClipboard.value = serializedItem
      toast.success('Item cut', {
        description: `${blockType || 'Block'} cut (using local storage)`
      })
      // eslint-disable-next-line no-console
      console.warn('Failed to copy to system clipboard, using localStorage:', error)
    }
  }

  const getClipboardItem = async (): Promise<ClipboardItem | null> => {
    try {
      // First try to read from system clipboard
      if (clipboardText.value) {
        const parsed = JSON.parse(clipboardText.value)
        if (parsed?.type === 'blocks-editor-clipboard-item') {
          return parsed as ClipboardItem
        }
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn('Failed to parse clipboard text:', error)
    }

    console.log('Using localStorage clipboard item', localStorageClipboard.value)
    // Fallback to localStorage
    if (localStorageClipboard.value) {
      const parsed = JSON.parse(localStorageClipboard.value)
      if (parsed?.type === 'blocks-editor-clipboard-item') {
        return parsed as ClipboardItem
      }
    }

    return null;
  }

  const pasteItem = async (): Promise<Record<string, unknown> | null> => {
    const clipboardItem = await getClipboardItem()

    if (!clipboardItem) {
      toast.error('Nothing to paste', {
        description: 'No items found in clipboard'
      })
      return null
    }


    return replaceIds(clipboardItem.data) as Record<string, unknown>
  }

  const hasClipboardItem = computed(async () => {
    const item = await getClipboardItem()

    return !!item
  })

  const clearClipboard = () => {
    localStorageClipboard.value = null
    toast.info('Clipboard cleared')
  }

  return {
    copyItem,
    cutItem,
    pasteItem,
    hasClipboardItem,
    clearClipboard,
    getClipboardItem
  }
}
