const DatosNegocioService = {
  filename: 'datos_negocio.json',

  async get() {
    const datos = await DataStore.read(this.filename);
    return datos || { nombre: 'Mi Negocio', direccion: '', telefono: '', logo: '' };
  },

  async update(data) {
    const datos = await this.get();
    const actualizado = {
      nombre: data.nombre ?? datos.nombre,
      direccion: data.direccion ?? datos.direccion,
      telefono: data.telefono ?? datos.telefono,
      logo: data.logo ?? datos.logo
    };
    await DataStore.write(this.filename, actualizado);
    return actualizado;
  },

  async getNombre() {
    const datos = await this.get();
    return datos.nombre || 'Mi Negocio';
  }
};

window.DatosNegocioService = DatosNegocioService;
