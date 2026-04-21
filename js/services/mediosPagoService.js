const MediosPagoService = {
  filename: 'medios_pago.json',

  async getAll() {
    return await DataStore.read(this.filename) || [];
  },

  async getById(id) {
    const medios = await this.getAll();
    return medios.find(m => m.id === id);
  },

  async create(data) {
    const medios = await this.getAll();
    const nuevo = {
      id: DataStore.generateId('mp'),
      nombre: data.nombre
    };
    medios.push(nuevo);
    await DataStore.write(this.filename, medios);
    return nuevo;
  },

  async update(id, data) {
    const medios = await this.getAll();
    const index = medios.findIndex(m => m.id === id);
    if (index === -1) return null;

    medios[index] = {
      ...medios[index],
      nombre: data.nombre ?? medios[index].nombre
    };

    await DataStore.write(this.filename, medios);
    return medios[index];
  },

  async delete(id) {
    const medios = await this.getAll();
    const filtrados = medios.filter(m => m.id !== id);
    await DataStore.write(this.filename, filtrados);
    return true;
  },

  async getNombres() {
    const medios = await this.getAll();
    return medios.map(m => m.nombre);
  }
};

window.MediosPagoService = MediosPagoService;
