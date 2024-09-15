import {
  deleteStorageItem, getAllStorageItems, reloadStorageItem, saveStorageItem, saveStorageItems
} from './api';
import { StorageEvents } from './constants';
import EventEmitter from './utils/EventEmitter';

class StorageWrapper extends EventEmitter {
  private static instance: StorageWrapper;

  private storageData: Record<string, any>;

  private constructor() {
    super();
    this.storageData = {};
  }

  public static get shared(): StorageWrapper {
    if (!StorageWrapper.instance) {
      StorageWrapper.instance = new StorageWrapper();
    }
    return StorageWrapper.instance;
  }

  public async init() {
    this.storageData = await getAllStorageItems();

    /**
     * Handle messages from worker services. Handle only storage realted messages
     *
     * @param message
     * @param sender
     * @returns
     */
    const handleWorkerMsgs = async (message: any, sender: any, sendResponse: any) => {
      if (sender.id === chrome.runtime.id) {
        if (message.action === StorageEvents.STORAGE_SINGLE_UPDATE) {
          this.storageData[message.key] = message.value;
          /* Emit the notification that variable was updated */
          this.emit(message.key, message.value);
        }
      }
      sendResponse({});
      return true;
    };
    chrome.runtime.onMessage.addListener(handleWorkerMsgs);
  }

  /**
     * Get a key value from the storage
     * @param key
     * @returns
     */
  public getItem(key: string) {
    return this.storageData[key];
  }

  /**
   * Sets a key-value pair in the Chrome Storage API
   * @param key
   * @param value
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public async setItem(key: string, value: any) {
    this.storageData[key] = value;
    await saveStorageItem(key, value);
  }

  /**
   * Sets a key-value pair in the Chrome Storage API
   * @param key
   * @param value
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public async setItems(data: Record<string, any>) {
    Object.keys(data).forEach((key) => {
      this.storageData[key] = data[key];
    });
    await saveStorageItems(data);
  }

  /**
  * Reload a key value from the Storage API
  * @param key
  * @returns
  */
  public async reloadItem(key: string): Promise<any> {
    if (key === undefined) return null;
    const result = await reloadStorageItem(key);
    this.storageData[key] = result;
    return result;
  }

  /**
   * Get an intem if the item exists on the collection, if not, return defaultValue
   * @param key
   * @param defaultValue
   * @returns
   */
  public getItemIfExists(key: string, defaultValue: any): any {
    return key && key in this.storageData ? this.storageData[key] : defaultValue;
  }

  /**
   * Remove the provided key
   * @param key
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public async removeItem(key: string) {
    if (key === undefined) return;
    await deleteStorageItem(key);
  }
}

const StorageCtrl = StorageWrapper.shared;
export default StorageCtrl;
