const Database = {
  dbName: 'levitar-pos',
  dbVersion: 2,
  db: null,
  stores: ['articulos', 'categorias', 'clientes', 'ventas', 'caja', 'medios_pago', 'datos_negocio', 'config'],

  async open() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion);

      request.onerror = () => reject(request.error);

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        
        if (!db.objectStoreNames.contains('articulos')) {
          const store = db.createObjectStore('articulos', { keyPath: 'id' });
          store.createIndex('codigo', 'codigo', { unique: false });
          store.createIndex('categoria', 'categoria', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('categorias')) {
          const store = db.createObjectStore('categorias', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('clientes')) {
          const store = db.createObjectStore('clientes', { keyPath: 'id' });
          store.createIndex('telefono', 'telefono', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('ventas')) {
          const store = db.createObjectStore('ventas', { keyPath: 'idVenta' });
          store.createIndex('fecha', 'fecha', { unique: false });
          store.createIndex('clienteId', 'clienteId', { unique: false });
        }
        
        if (!db.objectStoreNames.contains('caja')) {
          db.createObjectStore('caja', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('medios_pago')) {
          db.createObjectStore('medios_pago', { keyPath: 'id' });
        }
        
        if (!db.objectStoreNames.contains('datos_negocio')) {
          db.createObjectStore('datos_negocio', { keyPath: 'id' });
        }
      };
    });
  },

  async deleteDatabase() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.deleteDatabase(this.dbName);
      request.onsuccess = () => {
        this.db = null;
        resolve();
      };
      request.onerror = () => reject(request.error);
    });
  },

  async getStore(storeName, mode = 'readonly') {
    if (!this.db) await this.open();
    return this.db.transaction(storeName, mode).objectStore(storeName);
  },

  async getAll(storeName) {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.getAll();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async get(storeName, id) {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.get(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async put(storeName, data) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.put(data);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async delete(storeName, id) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.delete(id);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async clear(storeName) {
    const store = await this.getStore(storeName, 'readwrite');
    return new Promise((resolve, reject) => {
      const request = store.clear();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async count(storeName) {
    const store = await this.getStore(storeName);
    return new Promise((resolve, reject) => {
      const request = store.count();
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async getAllByIndex(storeName, indexName, value) {
    const store = await this.getStore(storeName);
    const index = store.index(indexName);
    return new Promise((resolve, reject) => {
      const request = index.getAll(value);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  },

  async migrateFromLocalStorage() {
    console.log('Database: Iniciando migración desde localStorage...');
    const files = ['articulos.json', 'categorias.json', 'clientes.json', 'ventas.json', 'caja.json', 'medios_pago.json', 'datos_negocio.json'];

    for (const file of files) {
      const storeName = file.replace('.json', '');
      const storageKey = 'pos_data_' + file;

      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const data = JSON.parse(localData);
          if (Array.isArray(data)) {
            for (const item of data) {
              await this.put(storeName, item);
            }
          } else if (data && typeof data === 'object') {
            await this.put(storeName, data);
          }
          console.log(`Database: Migrados ${data.length || 1} items a ${storeName}`);
        } catch (e) {
          console.warn(`Database: Error migrando ${file}:`, e.message);
        }
      }
    }

    console.log('Database: Migración completa');
  },

  async exportAll() {
    const exported = {};
    for (const storeName of this.stores) {
      const data = await this.getAll(storeName);
      if (data && data.length > 0) {
        exported[storeName] = data;
      }
    }
    return exported;
  },

  async importAll(data) {
    for (const storeName of this.stores) {
      if (data[storeName]) {
        await this.clear(storeName);
        for (const item of data[storeName]) {
          await this.put(storeName, item);
        }
        console.log(`Database: Importados ${data[storeName].length} items a ${storeName}`);
      }
    }
  },

  async close() {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  },

  async debugReset() {
    console.log('⚠️ Database: Reseteando base de datos...');
    for (const storeName of this.stores) {
      await this.clear(storeName);
    }
    localStorage.clear();
    console.log('✅ Database: Reseteada. Recargue la página.');
  },

  async debugShow() {
    console.log('=== DEBUG DATABASE ===');
    for (const storeName of this.stores) {
      const data = await this.getAll(storeName);
      console.log(`${storeName}: ${data.length} items`, data.slice(0, 3));
    }
    console.log('=====================');
  }
};

window.Database = Database;