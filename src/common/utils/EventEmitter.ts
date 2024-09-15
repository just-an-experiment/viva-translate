class EventEmitter {
  private events: { [key: string]: Function[] } = {};

  /**
   * Subscribe to an event
   * @param eventName
   * @param listener
   */
  on(eventName: string, listener: Function): void {
    if (!this.events[eventName]) {
      this.events[eventName] = [];
    }
    this.events[eventName].push(listener);
  }

  /**
   * Remove a listener from an event
   * @param eventName
   * @param listener
   * @returns
   */
  off(eventName: string, listener: Function): void {
    if (!this.events[eventName]) {
      return;
    }
    this.events[eventName] = this.events[eventName].filter((l) => l !== listener);
  }

  /**
   * Remove all listener from an event
   * @param eventName
   * @returns
   */
  offAll(eventName?: string): void {
    if (!eventName) {
      this.events = {};
      return;
    }
    if (!this.events[eventName]) {
      return;
    }
    this.events[eventName] = [];
  }

  /**
   * Emit an event
   * @param eventName
   * @param args
   * @returns
   */
  emit(eventName: string, ...args: any[]): void {
    if (!this.events[eventName]) {
      return;
    }
    this.events[eventName].forEach((listener) => {
      listener(...args);
    });
  }
}

export default EventEmitter;
