const ArticulosService = {
  filename: 'articulos.json',

  async getAll() {
    return await DataStore.read(this.filename) || [];
  },

  async getById(id) {
    const articulos = await this.getAll();
    return articulos.find(a => a.id === id);
  },

  async getByCodigo(codigo) {
    const articulos = await this.getAll();
    return articulos.find(a => a.codigo.toLowerCase() === codigo.toLowerCase());
  },

  async create(data) {
    const articulos = await this.getAll();
    const nuevo = {
      id: DataStore.generateId('art'),
      codigo: data.codigo.toLowerCase().replace(/\s+/g, '_'),
      nombre: data.nombre,
      categoria: data.categoria || 'general',
      precio: parseFloat(data.precio) || 0,
      stock: parseInt(data.stock) || 0
    };
    articulos.push(nuevo);
    await DataStore.write(this.filename, articulos);
    return nuevo;
  },

  async update(id, data) {
    const articulos = await this.getAll();
    const index = articulos.findIndex(a => a.id === id);
    if (index === -1) return null;

    articulos[index] = {
      ...articulos[index],
      nombre: data.nombre ?? articulos[index].nombre,
      categoria: data.categoria ?? articulos[index].categoria,
      precio: data.precio !== undefined ? parseFloat(data.precio) : articulos[index].precio,
      stock: data.stock !== undefined ? parseInt(data.stock) : articulos[index].stock,
      codigo: data.codigo?.toLowerCase().replace(/\s+/g, '_') ?? articulos[index].codigo
    };

    await DataStore.write(this.filename, articulos);
    return articulos[index];
  },

  async delete(id) {
    const articulos = await this.getAll();
    const filtrados = articulos.filter(a => a.id !== id);
    await DataStore.write(this.filename, filtrados);
    return true;
  },

  async updateStock(id, cantidad) {
    const articulos = await this.getAll();
    const index = articulos.findIndex(a => a.id === id);
    if (index === -1) return false;

    articulos[index].stock = Math.max(0, articulos[index].stock + cantidad);
    await DataStore.write(this.filename, articulos);
    return true;
  },

  async getByCategoria(categoria) {
    const articulos = await this.getAll();
    if (categoria === 'todos') return articulos;
    return articulos.filter(a => a.categoria === categoria);
  },

  async search(texto) {
    const articulos = await this.getAll();
    const busqueda = texto.toLowerCase();
    return articulos.filter(a =>
      a.nombre.toLowerCase().includes(busqueda) ||
      a.codigo.toLowerCase().includes(busqueda)
    );
  },

  async getCategorias() {
    const articulos = await this.getAll();
    const cats = new Set(articulos.map(a => a.categoria));
    return ['todos', ...Array.from(cats)];
  },

  async getTotalStock() {
    const articulos = await this.getAll();
    return articulos.reduce((sum, a) => sum + (a.stock || 0), 0);
  }
};

window.ArticulosService = ArticulosService;
