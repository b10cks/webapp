export type ContentUpdateEvent = {
  content: Record<string, never>;
}

export type SelectUpdateEvent = {
  selectedItem: string;
}

export type FieldUpdateEvent = {
  itemId: string
  field: string
  value: unknown
}

export type EventType = 'CONTENT_UPDATE' | 'SELECT_UPDATE' | 'HOVER_UPDATE' | 'FIELD_UPDATE'

export type EventPayloadMap = {
  'CONTENT_UPDATE': ContentUpdateEvent;
  'FIELD_UPDATE': FieldUpdateEvent;
  'SELECT_UPDATE': SelectUpdateEvent;
  'HOVER_UPDATE': SelectUpdateEvent;
};

export type BridgeEvent = {
  type: EventType;
  payload: ContentUpdateEvent | SelectUpdateEvent;
};

type EventCallback<T> = (payload: T) => void;

export class PreviewBridge {
  private eventListeners: {
    [key in EventType]?: Array<EventCallback<EventPayloadMap[key]>>;
  } = {};

  private iframeElement: HTMLIFrameElement | null = null

  constructor(iframeElement: HTMLIFrameElement) {
    this.iframeElement = iframeElement
    window.addEventListener('message', this.handleMessage)
  }

  private handleMessage = (event: MessageEvent): void => {
    if (!event.data || typeof event.data !== 'object') return;
    const { type, payload } = event.data;

    this.notifyListeners(type as EventType, payload);
  };

  private notifyListeners<T extends EventType>(type: T, payload: EventPayloadMap[T]): void {
    const listeners = this.eventListeners[type] as Array<EventCallback<EventPayloadMap[T]>> | undefined;

    if (listeners) {
      listeners.forEach(listener => listener(payload));
    }
  }

  private postMessageToIframe(type: EventType, payload: EventPayloadMap[typeof type]): void {
    if (!this.iframeElement || !this.iframeElement.contentWindow) {
      return;
    }

    this.iframeElement.contentWindow.postMessage(
      {
        type,
        payload
      },
      '*'
    );
  }

  public updateContent(content: Record<string, never>): void {
    this.postMessageToIframe(
      'CONTENT_UPDATE',
      { content }
    );
  }

  public updateSelectedItem(selectedItem: string): void {
    this.postMessageToIframe(
      'SELECT_UPDATE',
      { selectedItem }
    );
  }

  public updateHover(selectedItem: string | null): void {
    this.postMessageToIframe(
      'HOVER_UPDATE',
       { selectedItem }
    )
  }

  public on<T extends EventType>(
    eventType: T,
    callback: EventCallback<EventPayloadMap[T]>
  ): () => void {
    if (!this.eventListeners[eventType]) {
      this.eventListeners[eventType] = [];
    }

    (this.eventListeners[eventType] as Array<EventCallback<EventPayloadMap[T]>>).push(callback);

    return () => {
      this.eventListeners[eventType] = (this.eventListeners[eventType] as Array<EventCallback<EventPayloadMap[T]>>)
        .filter(listener => listener !== callback) as never;
    };
  }

  public destroy(): void {
    window.removeEventListener('message', this.handleMessage);
    this.eventListeners = {};
    this.iframeElement = null;
  }
}