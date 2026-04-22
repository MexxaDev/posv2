const CategoriasService = {
  filename: 'categorias.json',

  async getAll() {
    return await DataStore.read(this.filename) || [];
  },

  async getById(id) {
    const categorias = await this.getAll();
    return categorias.find(c => c.id === id);
  },

  async create(data) {
    const categorias = await this.getAll();
    const nuevo = {
      id: DataStore.generateId('cat'),
      nombre: data.nombre,
      color: data.color || '#6366f1'
    };
    categorias.push(nuevo);
    await DataStore.write(this.filename, categorias);
    return nuevo;
  },

  async update(id, data) {
    const categorias = await this.getAll();
    const index = categorias.findIndex(c => c.id === id);
    if (index === -1) return null;

    categorias[index] = {
      ...categorias[index],
      nombre: data.nombre ?? categorias[index].nombre,
      color: data.color ?? categorias[index].color
    };

    await DataStore.write(this.filename, categorias);
    return categorias[index];
  },

  async delete(id) {
    const categorias = await this.getAll();
    const filtrados = categorias.filter(c => c.id !== id);
    await DataStore.write(this.filename, filtrados);
    return true;
  }
};

window.CategoriasService = CategoriasService;