/**
 * IndexedDB storage utilities for saving and loading stories.
 */

import type { Story } from './types.js';

const DB_NAME = 'story_adventure';
const DB_VERSION = 1;
const STORE_NAME = 'stories';

let db: IDBDatabase | null = null;

/**
 * Stored story item structure in IndexedDB.
 */
interface StoredStory {
  id: string;
  story: Story;
}

/**
 * Initializes the IndexedDB database connection.
 *
 * @returns Promise resolving to the database instance
 */
async function init(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open_request = indexedDB.open(DB_NAME, DB_VERSION);

    open_request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest)?.error;
      console.error('Error loading database', event);
      reject(error);
    };

    open_request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      database.onerror = (errEvent) => {
        const error = (errEvent.target as IDBOpenDBRequest)?.error;
        console.error('Error initializing database', errEvent);
        reject(error || new Error('Database initialization error'));
      };
      database.createObjectStore(STORE_NAME, {
        keyPath: 'id',
      });
      console.log('Object store created.');
    };

    open_request.onsuccess = function (event) {
      console.log('Database opened.');
      db = (event.target as IDBOpenDBRequest).result;
      resolve(db);
    };
  });
}

/**
 * Opens a readwrite transaction on the stories store.
 *
 * @returns Promise resolving to the transaction
 */
async function open_transaction(): Promise<IDBTransaction> {
  if (!db) {
    await init();
  }
  if (!db) {
    throw new Error('Database initialization failed');
  }
  const transaction = db.transaction([STORE_NAME], 'readwrite');
  transaction.onerror = (event) => {
    const error = (event.target as IDBTransaction)?.error;
    console.error('Error in transaction', event);
    throw error;
  };
  return transaction;
}

/**
 * Resolves a store request, calling resolve or reject based on success/error.
 *
 * @param store_request - IndexedDB request object
 * @param resolve - Success callback
 * @param reject - Error callback
 */
function resolve_store_request(
  store_request: IDBRequest<StoredStory | undefined>,
  resolve: (value: Story | undefined) => void,
  reject: (error: Error) => void
): void {
  store_request.onsuccess = (event) => {
    const item = (event.target as IDBRequest<StoredStory | undefined>)?.result;
    console.debug('successful store event for key', item?.id);
    resolve(item?.story);
  };
  store_request.onerror = (event) => {
    const error = (event.target as IDBRequest)?.error;
    console.error('Error in store operation', event);
    reject(error || new Error('Unknown store operation error'));
  };
}

/**
 * Saves a story to IndexedDB.
 *
 * @param id - Unique identifier for the story
 * @param story - Story object to save
 * @returns Promise resolving to the saved story
 *
 * @example
 * ```ts
 * await save_story("my-story-1", storyObject);
 * ```
 */
export async function save_story(id: string, story: Story): Promise<Story> {
  console.debug('save', id);
  const transaction = await open_transaction();

  return new Promise((resolve, reject) => {
    const new_item: StoredStory = {
      id: id,
      story: story,
    };

    // Check if item exists, then use put (update) or add (create)
    const getRequest = transaction.objectStore(STORE_NAME).get(id);
    getRequest.onsuccess = () => {
      const existing = getRequest.result;
      const request = existing
        ? transaction.objectStore(STORE_NAME).put(new_item) // update
        : transaction.objectStore(STORE_NAME).add(new_item); // create
      resolve_store_request(
        request as unknown as IDBRequest<StoredStory | undefined>,
        (value) => {
          if (value) {
            resolve(value);
          } else {
            resolve(story); // Return original story if stored value is undefined
          }
        },
        reject
      );
    };
    getRequest.onerror = () => {
      reject(new Error('Failed to check existing story'));
    };
  });
}

/**
 * Retrieves a story from IndexedDB.
 *
 * @param id - Unique identifier for the story
 * @returns Promise resolving to the story, or undefined if not found
 *
 * @example
 * ```ts
 * const story = await get_story("my-story-1");
 * ```
 */
export async function get_story(id: string): Promise<Story | undefined> {
  console.debug('get', id);
  const transaction = await open_transaction();
  return new Promise((resolve, reject) => {
    resolve_store_request(
      transaction.objectStore(STORE_NAME).get(id),
      resolve,
      reject
    );
  });
}
