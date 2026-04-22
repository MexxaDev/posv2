const DataStore = {
  basePath: 'data',
  storageKey: 'pos_data_',
  initialized: false,

  async read(filename) {
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
      : null;
  },

  async write(filename, data) {
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

  generateId(prefix = 'id') {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  },

  clear(filename = null) {
    if (filename) {
      localStorage.removeItem(this.storageKey + filename);
    } else {
      Object.keys(localStorage)
        .filter(k => k.startsWith(this.storageKey))
        .forEach(k => localStorage.removeItem(k));
    }
  }
};

window.DataStore = DataStore;