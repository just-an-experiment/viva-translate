import { errorLog } from '../common/utils/logger';
import EventEmitter from '../common/utils/EventEmitter';
import { StorageEvents } from '../common/constants';

class Storage extends EventEmitter {
  private static instance: Storage;

  private storageInstance: Record<string, any>;

  private constructor() {
    super();
    this.storageInstance = {};
  }

  public static get shared(): Storage {
    if (!Storage.instance) {
      Storage.instance = new Storage();
    }
    return Storage.instance;
  }

  public async init() {
    try {
      const storageData = await this.getAllData();
      /* Copy the data retrieved from storage into storageInstance. */
      Object.assign(this.storageInstance, storageData);
      chrome.storage.onChanged.addListener(this.storageChangeCb.bind(this));
    } catch (error) {
      errorLog(error, { description: 'Error reading from storage API' });
    }
  }

  /**
   * Function to be hooked up to the storage sync change listener. Listens to changes and
   * keeps the local storage instance in sync.
   * @param update
   */
  private storageChangeCb(update: any) {
    const entries = Object.entries(update);
    entries?.forEach((entry: any[]) => {
      const key = entry[0];
      const value = entry[1].newValue;
      if (value === undefined || value === null) {
        delete this.storageInstance[key];
      } else {
        this.storageInstance[key] = value;
      }
      this.emit(StorageEvents.STORAGE_SINGLE_UPDATE, key, value);
    });
  }

  /**
   * Read all data from from Storage API
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public getAllData(): Promise<any> {
    return new Promise((resolve, reject) => {
      /* Asynchronously fetch all data from storage.sync. */
      chrome.storage.sync.get(null, (items) => {
        /* Pass any observed errors down the promise chain. */
        if (chrome.runtime.lastError) {
          reject(chrome.runtime.lastError);
          return;
        }
        /* Pass the data retrieved from storage down the promise chain. */
        resolve(items);
      });
    });
  }

  public get items() {
    return this.storageInstance;
  }

  /**
   * Sets a key-value pair in the Chrome Storage API
   * @param key
   * @param value
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public async setItem(key: string, value: any) {
    if (key === undefined) return;
    const newObject: any = {};
    newObject[key] = value;
    await chrome.storage.sync.set(newObject).catch((error) => {
      errorLog(error, { description: 'Error saving to Storage API', key, value });
      throw error;
    });
  }

  /**
   * Sets a key-value pair in the Chrome Storage API
   * @param key
   * @param value
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public async setItems(items: { [key: string]: any }) {
    if (items === undefined) return;
    await chrome.storage.sync.set(items).catch((error) => {
      errorLog(error, { description: 'Error saving to Storage API', items });
    });
  }

  /**
   * Get a key value from the storage
   * @param key
   * @returns
   */
  public getItem(key: string): any {
    if (key === undefined || !(key in this.storageInstance)) return null;
    return this.storageInstance[key];
  }

  /**
   * Reload a key value from the Storage API
   * @param key
   * @returns
   */
  public async reloadItem(key: string): Promise<any> {
    if (key === undefined) return null;
    const result = await chrome.storage.sync.get([key]);
    this.storageInstance[key] = result[key];
    return result[key];
  }

  /**
   * Get an intem if the item exists on the collection, if not, return defaultValue
   * @param key
   * @param defaultValue
   * @returns
   */
  public getItemIfExists(key: string, defaultValue: any): any {
    return key && key in this.storageInstance ? this.storageInstance[key] : defaultValue;
  }

  /**
   * Remove the provided key
   * @param key
   * @returns
   */
  // eslint-disable-next-line class-methods-use-this
  public async removeItem(key: string) {
    if (key === undefined) return;
    await chrome.storage.sync.remove(key).catch((error) => {
      errorLog(error, { description: 'Error removing to Storage API', key });
      throw error;
    });
  }
}

export default Storage.shared;
