const DataStore = {
  basePath: 'data',
  storageKey: 'pos_data_',
  initialized: false,
  useIndexedDB: true,

  isSingleton(storeName) {
    return ['caja', 'datos_negocio'].includes(storeName);
  },

  isArrayStore(storeName) {
    return ['articulos', 'categorias', 'clientes', 'ventas', 'medios_pago'].includes(storeName);
  },

  async read(filename) {
    const storeName = filename.replace('.json', '');
    
    if (this.useIndexedDB && typeof Database !== 'undefined') {
      try {
        await Database.open();
        
        if (this.isSingleton(storeName)) {
          const data = await Database.getAll(storeName);
          return data.length > 0 ? data[0] : (filename.includes('caja') ? {abierta: false, fechaApertura: null, saldoInicial: 0, ventas: [], ventasEfectivo: 0, ventasTransferencia: 0, ventasDebito: 0, ventasCredito: 0, total: 0, fechaCierre: null, saldoReal: 0} : null);
        } else {
          const data = await Database.getAll(storeName);
          return data.length > 0 ? data : [];
        }
      } catch (e) {
        console.warn(`Error leyendo ${filename} desde IndexedDB:`, e.message);
      }
    }

    const storageKey = this.storageKey + filename;
    const stored = localStorage.getItem(storageKey);
    if (stored) {
      try {
        return JSON.parse(stored);
      } catch (e) {
        console.warn(`Error parsing stored ${filename}, recargando...`);
      }
    }

    try {
      const res = await fetch(`${this.basePath}/${filename}`);
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem(storageKey, JSON.stringify(data));
        return data;
      }
    } catch (e) {
      console.warn(`No se pudo cargar ${filename} desde archivo:`, e.message);
    }

    return filename.includes('.json') && !filename.includes('ventas')
      ? []
      : [];
  },

  async write(filename, data) {
    const storeName = filename.replace('.json', '');
    
    if (this.useIndexedDB && typeof Database !== 'undefined') {
      try {
        await Database.open();
        
        if (this.isSingleton(storeName)) {
          await Database.put(storeName, data);
        } else if (Array.isArray(data)) {
          await Database.clear(storeName);
          for (const item of data) {
            await Database.put(storeName, item);
          }
        } else if (data && typeof data === 'object') {
          await Database.clear(storeName);
          await Database.put(storeName, data);
        }
        return true;
      } catch (e) {
        console.warn(`Error escribiendo ${filename} en IndexedDB:`, e.message);
      }
    }

    const storageKey = this.storageKey + filename;
    try {
      localStorage.setItem(storageKey, JSON.stringify(data, null, 2));
      return true;
    } catch (e) {
      console.error(`Error writing ${filename}:`, e);
      return false;
    }
  },

  async init() {
    if (this.initialized) {
      console.log('DataStore: Ya inicializado');
      return;
    }

    if (this.useIndexedDB && typeof Database !== 'undefined') {
      try {
        await Database.open();
        const articulos = await Database.getAll('articulos');
        
        if (articulos && articulos.length > 0) {
          console.log('DataStore: Usando IndexedDB existente');
          this.initialized = true;
          return;
        }

        console.log('DataStore: Migrando datos desde localStorage a IndexedDB...');
        await this.migrateFromLocalStorage();
        this.initialized = true;
        console.log('DataStore: Inicialización completa con IndexedDB');
        return;
      } catch (e) {
        console.warn('IndexedDB no disponible, usando localStorage:', e.message);
        this.useIndexedDB = false;
      }
    }

    console.log('DataStore: Inicializando datos desde archivos...');
    const files = ['articulos.json', 'categorias.json', 'clientes.json', 'medios_pago.json', 'datos_negocio.json', 'caja.json'];

    for (const file of files) {
      const storageKey = this.storageKey + file;
      if (!localStorage.getItem(storageKey)) {
        try {
          const res = await fetch(`${this.basePath}/${file}`);
          if (res.ok) {
            const data = await res.json();
            localStorage.setItem(storageKey, JSON.stringify(data));
            console.log(`DataStore: Cargado ${file} (${Array.isArray(data) ? data.length : 'object'} items)`);
          }
        } catch (e) {
          console.warn(`No se pudo cargar ${file}:`, e.message);
        }
      }
    }

    if (!localStorage.getItem(this.storageKey + 'ventas.json')) {
      localStorage.setItem(this.storageKey + 'ventas.json', '[]');
    }

    this.initialized = true;
    console.log('DataStore: Inicialización completa');
  },

  async migrateFromLocalStorage() {
    console.log('Database: Iniciando migración desde localStorage...');
    const files = ['articulos.json', 'categorias.json', 'clientes.json', 'ventas.json', 'medios_pago.json'];

    for (const file of files) {
      const storeName = file.replace('.json', '');
      const storageKey = 'pos_data_' + file;

      const localData = localStorage.getItem(storageKey);
      if (localData) {
        try {
          const data = JSON.parse(localData);
          if (Array.isArray(data)) {
            for (const item of data) {
              await Database.put(storeName, item);
            }
          } else if (data && typeof data === 'object') {
            await Database.put(storeName, data);
          }
          console.log(`Database: Migrados ${data.length || 1} items a ${storeName}`);
        } catch (e) {
          console.warn(`Database: Error migrando ${file}:`, e.message);
        }
      }
    }

    const cajaData = {id: 'caja_principal', abierta: false, fechaApertura: null, saldoInicial: 0, ventas: [], ventasEfectivo: 0, ventasTransferencia: 0, ventasDebito: 0, ventasCredito: 0, total: 0, fechaCierre: null, saldoReal: 0};
    await Database.put('caja', cajaData);

    console.log('Database: Migración completa');
  },

  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  clear(filename = null) {
    if (filename) {
      localStorage.removeItem(this.storageKey + filename);
      if (typeof Database !== 'undefined' && Database.db) {
        const storeName = filename.replace('.json', '');
        Database.clear(storeName);
      }
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.storageKey))
        .forEach(k => localStorage.removeItem(k));
    }
  }
};

window.DataStore = DataStore;