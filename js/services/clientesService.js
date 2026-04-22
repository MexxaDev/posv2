const ClientesService = {
  filename: 'clientes.json',

  async getAll() {
    return await DataStore.read(this.filename) || [];
  },

  async getById(id) {
    const clientes = await this.getAll();
    return clientes.find(c => c.id === id);
  },

  async getByTelefono(telefono) {
    const clientes = await this.getAll();
    return clientes.find(c => c.telefono === telefono);
  },

  async search(texto) {
    const clientes = await this.getAll();
    const busqueda = texto.toLowerCase();
    return clientes.filter(c =>
      c.nombreCliente.toLowerCase().includes(busqueda) ||
      (c.telefono && c.telefono.includes(busqueda))
    );
  },

  async create(data) {
    const clientes = await this.getAll();
    const nuevo = {
      id: DataStore.generateId('cli'),
      nombreCliente: data.nombreCliente,
      telefono: data.telefono || '',
      direccion: data.direccion || '',
      deuda: 0,
      totalGastado: 0,
      visitas: 0,
      fechaAlta: new Date().toISOString(),
      fechaUltimaCompra: null
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
      nombreCliente: data.nombreCliente ?? clientes[index].nombreCliente,
      telefono: data.telefono ?? clientes[index].telefono,
      direccion: data.direccion ?? clientes[index].direccion
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
  },

  async registrarCompra(clienteId, monto) {
    const clientes = await this.getAll();
    const index = clientes.findIndex(c => c.id === clienteId);
    if (index === -1) return null;

    clientes[index].totalGastado = (clientes[index].totalGastado || 0) + monto;
    clientes[index].visitas = (clientes[index].visitas || 0) + 1;
    clientes[index].fechaUltimaCompra = new Date().toISOString();

    await DataStore.write(this.filename, clientes);
    return clientes[index];
  },

  async getHistorial(clienteId) {
    const ventas = await VentasService.getAll();
    return ventas.filter(v => v.clienteId === clienteId).sort((a, b) => 
      new Date(b.fecha) - new Date(a.fecha)
    );
  },

  async getTopClientes(limite = 10) {
    const clientes = await this.getAll();
    return [...clientes]
      .sort((a, b) => (b.totalGastado || 0) - (a.totalGastado || 0))
      .slice(0, limite);
  }
};

window.ClientesService = ClientesService;
