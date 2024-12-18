const db_name = "story_adventure";
const db_version = 1;
const store_name = "stories";

let db;

function handle_error(event, reject, msg) {
  const error = event?.error || event?.target?.error;
  console.error(msg, event);
  reject(error);
}

async function init() {
  return new Promise((resolve, reject) => {
    const open_request = window.indexedDB.open(db_name, db_version);

    // Register two event handlers to act on the database being opened successfully, or not
    open_request.onerror = (event) => {
      handle_error(event, reject, "Error loading database");
    };

    open_request.onupgradeneeded = (event) => {
      db = event.target.result;

      db.onerror = (event) => {
        handle_error(event, reject, "Error initializing database");
      };
      db.createObjectStore(store_name, {
        keyPath: "id",
      });
      console.log("Object store created.");
    };

    open_request.onsuccess = function (event) {
      console.log("Database opened.");
      db = open_request.result;
      resolve(db);
    };
  });
}

async function open_transaction() {
  if (!db) {
    await init();
  }
  const transaction = db.transaction([store_name], "readwrite");
  transaction.onerror = (event) => {
    handle_error(
      event,
      (error) => {
        throw error;
      },
      "Error loading database"
    );
  };
  return transaction;
}

export async function save_story(id, story) {
  console.debug("save", id);
  const transaction = await open_transaction();

  return new Promise((resolve, reject) => {
    const new_item = {
      id: id,
      story: story,
    };

    // save = put or add
    resolve_store_request(
      transaction.objectStore(store_name).get(id),
      () => {
        resolve_store_request(
          transaction.objectStore(store_name).put(new_item), // if exists -> put to update
          resolve,
          reject
        );
      },
      () => {
        resolve_store_request(
          transaction.objectStore(store_name).add(new_item), // if not exists -> add
          resolve,
          reject
        );
      }
    );
  });
}

function resolve_store_request(store_request, resolve, reject) {
  store_request.onsuccess = (event) => {
    const item = store_request?.result;
    console.debug("successful store event for key", item?.id);
    resolve(item?.story);
  };
  store_request.onerror = (event) => {
    handle_error(event,reject, "Error in store operation");
  };
}

export async function get_story(id) {
  console.debug("get", id);
  const transaction = await open_transaction();
  return new Promise((resolve, reject) => {
    resolve_store_request(
      transaction.objectStore(store_name).get(id),
      resolve,
      reject
    );
  });
}
