const CajaService = {
  filename: 'caja.json',

  async getEstado() {
    return await DataStore.read(this.filename) || this.getDefault();
  },

  getDefault() {
    return {
      abierta: false,
      fechaApertura: null,
      saldoInicial: 0,
      ventas: [],
      ventasEfectivo: 0,
      ventasTransferencia: 0,
      ventasDebito: 0,
      ventasCredito: 0,
      total: 0,
      fechaCierre: null,
      saldoReal: 0
    };
  },

  async estaAbierta() {
    const estado = await this.getEstado();
    if (!estado.abierta) return false;

    const hoy = new Date().toISOString().split('T')[0];
    const fechaApertura = estado.fechaApertura?.split('T')[0];

    return fechaApertura === hoy;
  },

  async abrir(saldoInicial) {
    const estado = this.getDefault();
    estado.abierta = true;
    estado.fechaApertura = new Date().toISOString();
    estado.saldoInicial = parseFloat(saldoInicial) || 0;

    await DataStore.write(this.filename, estado);
    return estado;
  },

  async agregarVenta(venta) {
    const estado = await this.getEstado();
    if (!estado.abierta) return false;

    estado.ventas.push(venta);

    switch (venta.medioPago) {
      case 'Efectivo':
        estado.ventasEfectivo += venta.monto;
        break;
      case 'Transferencia':
        estado.ventasTransferencia += venta.monto;
        break;
      case 'Débito':
        estado.ventasDebito += venta.monto;
        break;
      case 'Crédito':
        estado.ventasCredito += venta.monto;
        break;
    }

    estado.total = estado.ventasEfectivo + estado.ventasTransferencia + estado.ventasDebito + estado.ventasCredito;

    await DataStore.write(this.filename, estado);
    return estado;
  },

  async cerrar(saldoReal = 0) {
    const estado = await this.getEstado();
    if (!estado.abierta) return null;

    estado.abierta = false;
    estado.fechaCierre = new Date().toISOString();
    estado.saldoReal = parseFloat(saldoReal) || 0;

    await DataStore.write(this.filename, estado);
    return estado;
  },

  async getResumen() {
    const estado = await this.getEstado();
    const saldoTeorico = estado.saldoInicial + estado.ventasEfectivo;
    const diferencia = estado.saldoReal > 0 ? estado.saldoReal - saldoTeorico : null;

    return {
      saldoInicial: estado.saldoInicial,
      ventasEfectivo: estado.ventasEfectivo,
      ventasTransferencia: estado.ventasTransferencia,
      ventasDebito: estado.ventasDebito,
      ventasCredito: estado.ventasCredito,
      totalVentas: estado.total,
      saldoTeorico: saldoTeorico,
      saldoReal: estado.saldoReal,
      diferencia: diferencia,
      cantidadVentas: estado.ventas.length
    };
  },

  async generarCSV() {
    const estado = await this.getEstado();
    const resumen = await this.getResumen();
    const fecha = new Date().toLocaleString();

    let csv = 'CIERRE DE CAJA\n';
    csv += `Fecha cierre,${fecha}\n\n`;
    csv += `Saldo inicial,${estado.saldoInicial}\n\n`;
    csv += 'Fecha Venta,Producto,Cantidad,Precio Unitario,Total,Medio Pago\n';

    estado.ventas.forEach(venta => {
      venta.items.forEach(item => {
        const totalItem = item.precio * item.cantidad;
        csv += `${venta.fecha},${item.nombre},${item.cantidad},${item.precio},${totalItem},${venta.medioPago}\n`;
      });
    });

    csv += '\n';
    csv += `TOTAL EFECTIVO,,,${estado.ventasEfectivo}\n`;
    csv += `TOTAL TRANSFERENCIA,,,${estado.ventasTransferencia}\n`;
    csv += `TOTAL DÉBITO,,,${estado.ventasDebito}\n`;
    csv += `TOTAL CRÉDITO,,,${estado.ventasCredito}\n`;
    csv += `TOTAL GENERAL,,,${estado.total}\n`;
    csv += `\nSALDO TEÓRICO,,,${resumen.saldoTeorico}\n`;

    if (estado.saldoReal > 0) {
      csv += `SALDO REAL,,,${estado.saldoReal}\n`;
      csv += `DIFERENCIA,,,${resumen.diferencia}\n`;
    }

    return csv;
  },

  async descargarCSV() {
    const csv = await this.generarCSV();
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cierre_caja_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
};

window.CajaService = CajaService;