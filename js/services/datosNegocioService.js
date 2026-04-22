const DatosNegocioService = {
  filename: 'datos_negocio.json',
  _cache: null,

  async get() {
    if (this._cache) return this._cache;
    const datos = await DataStore.read(this.filename);
    this._cache = datos || { nombre: 'Mi Negocio', direccion: '', telefono: '', whatsapp: '', logo: '' };
    return this._cache;
  },

  getSync() {
    return this._cache || { nombre: 'Mi Negocio', direccion: '', telefono: '', whatsapp: '' };
  },

  async update(data) {
    const datos = await this.get();
    const actualizado = {
      nombre: data.nombre ?? datos.nombre,
      direccion: data.direccion ?? datos.direccion,
      telefono: data.telefono ?? datos.telefono,
      whatsapp: data.whatsapp ?? datos.whatsapp,
      logo: data.logo ?? datos.logo
    };
    this._cache = actualizado;
    await DataStore.write(this.filename, actualizado);
    return actualizado;
  },

  async getNombre() {
    const datos = await this.get();
    return datos.nombre || 'Mi Negocio';
  },

  clearCache() {
    this._cache = null;
  }
};

window.DatosNegocioService = DatosNegocioService;
