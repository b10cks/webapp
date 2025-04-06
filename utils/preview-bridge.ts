import Postmate from 'postmate'
import { useDebounce } from '@vueuse/core'

export interface PreviewBridgeOptions {
  debounceMs?: number
}

export class PreviewBridge {
  private parent: Postmate.ParentAPI | null = null
  private callbacks: Record<string, Function[]> = {}
  private debouncedEmit: Function
  private isDebug: boolean = false

  constructor(private options: PreviewBridgeOptions = {}) {
    this.debouncedEmit = useDebounce(this.emit.bind(this), options.debounceMs || 300)
    this.isDebug = true // ptions.debug || false
  }

  /**
   * Initialize the bridge as parent (content editor)
   * @param iframe The iframe element containing the preview
   * @returns Promise that resolves when the connection is established
   */
  async init(iframe: HTMLIFrameElement): Promise<void> {
    try {
      if (this.isDebug) {
        console.log('CMS: Initializing CMS parent bridge with iframe:', iframe.src)
        Postmate.debug = true
      }

      const handshake = new Postmate({
        container: iframe,
        url: iframe.src,
        model: {
          // Initial shared model
          selectedItemId: null,
          content: null
        }
      })

      this.parent = await handshake
      this.setupListeners()

      if (this.isDebug) {
        console.log('CMS: CMS parent bridge initialized successfully')
      }

      return Promise.resolve()
    } catch (error) {
      console.error('Failed to establish connection with preview:', error)
      return Promise.reject(error)
    }
  }

  /**
   * Update content in the preview (parent -> child)
   * @param content The content to update
   */
  updateContent(content: any): void {
    if (!this.parent) return

    if (this.isDebug) {
      console.log('CMS: Updating content in preview:', content)
    }

    this.debouncedEmit('contentUpdated', content)
  }

  /**
   * Set the currently selected item ID (parent -> child)
   * @param itemId The ID of the selected item
   */
  setSelectedItem(itemId: string | null): void {
    if (!this.parent) return

    if (this.isDebug) {
      console.log('CMS: Setting selected item in preview:', itemId)
    }

    this.parent.call('selectItem', itemId)
  }

  updateItem(content: never): void {
    if (!this.parent) return

    if (this.isDebug) {
      console.log('CMS: Updating item in preview:', content)
    }

    this.parent.call('updateItem', content)
  }

  /**
   * Register a callback for an event
   * @param event Event name
   * @param callback Function to call when the event occurs
   */
  on(event: string, callback: Function): void {
    if (!this.callbacks[event]) {
      this.callbacks[event] = []
    }
    this.callbacks[event].push(callback)

    if (this.isDebug) {
      console.log(`Registered callback for event '${event}'`)
    }
  }

  /**
   * Remove a callback for an event
   * @param event Event name
   * @param callback Function to remove
   */
  off(event: string, callback: Function): void {
    if (!this.callbacks[event]) return

    const index = this.callbacks[event].indexOf(callback)
    if (index !== -1) {
      this.callbacks[event].splice(index, 1)

      if (this.isDebug) {
        console.log(`Removed callback for event '${event}'`)
      }
    }
  }

  /**
   * Trigger callbacks for an event
   * @param event Event name
   * @param data Data to pass to the callbacks
   */
  private trigger(event: string, data?: any): void {
    if (!this.callbacks[event]) return

    if (this.isDebug) {
      console.log(`Triggering event '${event}' with data:`, data)
    }

    this.callbacks[event].forEach(callback => {
      callback(data)
    })
  }

  /**
   * Emit an event to the child
   * @param event Event name
   * @param data Data to send
   */
  private emit(event: string, data?: any): void {
    if (this.parent) {
      if (this.isDebug) {
        console.log(`Emitting event '${event}' to child with data:`, data)
      }

      this.parent.emit(event, data)
    }
  }

  /**
   * Set up event listeners for the parent (content editor)
   */
  private setupListeners(): void {
    if (!this.parent) return

    if (this.isDebug) {
      console.log('CMS: Setting up parent listeners')
    }

    // Listen for select item requests from the child
    this.parent.on('selectItem', (itemId: string) => {
      if (this.isDebug) {
        console.log('CMS: Child requested to select item:', itemId)
      }

      this.trigger('selectItem', itemId)
    })
  }

  /**
   * Check if the bridge is connected
   */
  isConnected(): boolean {
    return !!this.parent
  }
}

// Create a singleton instance
export const previewBridge = new PreviewBridge()