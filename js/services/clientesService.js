const ClientesService = {
  filename: 'clientes.json',

  async getAll() {
    return await DataStore.read(this.filename) || [];
  },

  async getById(id) {
    const clientes = await this.getAll();
    return clientes.find(c => c.id === id);
  },

  async create(data) {
    const clientes = await this.getAll();
    const nuevo = {
      id: DataStore.generateId('cli'),
      nombreCliente: data.nombreCliente
    };
    clientes.push(nuevo);
    await DataStore.write(this.filename, clientes);
    return nuevo;
  },

  async update(id, data) {
    const clientes = await this.getAll();
    const index = clientes.findIndex(c => c.id === id);
    if (index === -1) return null;

    clientes[index] = {
      ...clientes[index],
      nombreCliente: data.nombreCliente ?? clientes[index].nombreCliente
    };

    await DataStore.write(this.filename, clientes);
    return clientes[index];
  },

  async delete(id) {
    const clientes = await this.getAll();
    const filtrados = clientes.filter(c => c.id !== id);
    await DataStore.write(this.filename, filtrados);
    return true;
  },

  async getCount() {
    const clientes = await this.getAll();
    return clientes.length;
  }
};

window.ClientesService = ClientesService;
