/**
 * @typedef {{id: never}} Item
 * @typedef {{id: number}} ItemWithId
 * @typedef {Map<number, Item>} Store
 * @typedef {{store: Store, nextId: number}} ItemStore
 */

/**
 * @param {Item[]} items
 * @returns {ItemStore}
 */
export function create(items = []) {
  const store = new Map();
  const nextId = 0;
  return items.reduce(add, { store, nextId });
}

/**
 * @param {ItemStore} itemStore
 * @param {number} id
 * @returns {ItemWithId}
 */
export function get(itemStore, id) {
  const { store } = itemStore;
  checkId(store, id);
  return { id, ...store.get(id) };
}

/**
 * @param {ItemStore} itemStore
 * @param {(x: ItemWithId) => boolean} pred
 * @returns {ItemWithId | undefined}
 */
export function find(itemStore, pred) {
  return [...itemStore.store.entries()]
    .map(([id, item]) => ({ id, ...item }))
    .find(pred);
}

/**
 * @param {ItemStore} itemStore
 * @param {(x: ItemWithId) => boolean} pred
 * @returns {ItemWithId[]}
 */
export function filter(itemStore, pred) {
  return [...itemStore.store.entries()]
    .map(([id, item]) => ({ id, ...item }))
    .filter(pred);
}

/**
 * @param {ItemStore} itemStore
 * @param {Item} item
 * @returns {ItemStore}
 */
export function add(itemStore, item) {
  const { store, nextId } = itemStore;
  store.set(nextId, item);
  return { store, nextId: nextId + 1 };
}

/**
 * @param {ItemStore} itemStore
 * @param {number} id
 * @param {Item} item
 * @returns {ItemStore}
 */
export function set(itemStore, id, item) {
  const { store, nextId } = itemStore;
  checkId(store, id);
  store.set(id, item);
  return { store, nextId };
}

/**
 * @param {ItemStore} itemStore
 * @param {number} id
 * @returns {ItemStore}
 */
export function remove(itemStore, id) {
  const { store, nextId } = itemStore;
  checkId(store, id);
  store.delete(id);
  return { store, nextId };
}

/**
 * @param {Store} store
 * @param {number} id
 */
function checkId(store, id) {
  if (!store.has(id)) {
    throw new Error(`Unknown id ${id}`);
  }
}
