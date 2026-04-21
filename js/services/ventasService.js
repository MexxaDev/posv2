const VentasService = {
  filename: 'ventas.json',

  async getAll() {
    return await DataStore.read(this.filename) || [];
  },

  async create(data) {
    const ventas = await this.getAll();
    const nueva = {
      idVenta: DataStore.generateId('venta'),
      cliente: data.cliente || 'Cliente Mostrador',
      monto: data.monto,
      medioPago: data.medioPago,
      fecha: data.fecha || new Date().toISOString(),
      items: data.items || []
    };
    ventas.push(nueva);
    await DataStore.write(this.filename, ventas);
    return nueva;
  },

  async getById(id) {
    const ventas = await this.getAll();
    return ventas.find(v => v.idVenta === id);
  },

  async getByFecha(fecha) {
    const ventas = await this.getAll();
    return ventas.filter(v => v.fecha.startsWith(fecha));
  },

  async getVentasDelDia() {
    const hoy = new Date().toISOString().split('T')[0];
    const ventas = await this.getAll();
    return ventas.filter(v => v.fecha.startsWith(hoy));
  },

  async getIngresosDelDia() {
    const ventas = await this.getVentasDelDia();
    return ventas.reduce((sum, v) => sum + (v.monto || 0), 0);
  },

  async getTotalVentas() {
    const ventas = await this.getAll();
    return ventas.length;
  },

  async getEstadisticasMediosPago() {
    const ventas = await this.getAll();
    const medios = {};
    ventas.forEach(v => {
      const mp = v.medioPago || 'Otro';
      medios[mp] = (medios[mp] || 0) + v.monto;
    });
    return medios;
  },

  async getVentasUltimosDias(dias = 7) {
    const ventas = await this.getAll();
    const resultado = [];
    for (let i = dias - 1; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const fechaStr = fecha.toISOString().split('T')[0];
      const ventasDia = ventas.filter(v => v.fecha.startsWith(fechaStr));
      resultado.push({
        fecha: fechaStr,
        cantidad: ventasDia.length,
        monto: ventasDia.reduce((sum, v) => sum + v.monto, 0)
      });
    }
    return resultado;
  },

  async generarCSV() {
    const ventas = await this.getAll();
    let csv = 'ID,Fecha,Cliente,Monto,Medio de Pago\n';
    ventas.forEach(v => {
      csv += `${v.idVenta},${v.fecha},"${v.cliente}",${v.monto},${v.medioPago}\n`;
    });
    return csv;
  },

  async descargarCSV() {
    const csv = await this.generarCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
};

window.VentasService = VentasService;
