const CajaService = {
  filename: 'caja.json',
  STORAGE_KEY: 'caja_abierta_hoy',

  async getEstado() {
    const data = await DataStore.read(this.filename) || {};
    const defaults = this.getDefault();
    return { ...defaults, ...data };
  },

  getDefault() {
    return {
      id: 'caja_principal',
      abierta: false,
      fechaApertura: null,
      saldoInicial: 0,
      movimientos: [],
      movimientosIngresos: 0,
      movimientosEgresos: 0,
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

    const abiertaHoy = localStorage.getItem(this.STORAGE_KEY);
    if (fechaApertura !== hoy || !abiertaHoy) {
      return false;
    }

    return true;
  },

  async abrir(saldoInicial) {
    const estado = this.getDefault();
    estado.abierta = true;
    estado.fechaApertura = new Date().toISOString();
    estado.saldoInicial = parseFloat(saldoInicial) || 0;

    if (estado.saldoInicial > 0) {
      estado.movimientos.push({
        id: DataStore.generateId('mov'),
        tipo: 'ingreso',
        concepto: 'Apertura de caja - Saldo inicial',
        monto: estado.saldoInicial,
        medio: 'Efectivo',
        fecha: new Date().toISOString(),
        usuario: AuthService?.getUser()?.email || 'sistema'
      });
      estado.movimientosIngresos = estado.saldoInicial;
      estado.ventasEfectivo = estado.saldoInicial;
    }

    await DataStore.write(this.filename, estado);

    const hoy = new Date().toISOString().split('T')[0];
    localStorage.setItem(this.STORAGE_KEY, hoy);

    return estado;
  },

  async agregarMovimiento(tipo, concepto, monto, medio = 'Efectivo') {
    const estado = await this.getEstado();
    if (!estado.abierta) return null;

    const movimiento = {
      id: DataStore.generateId('mov'),
      tipo: tipo,
      concepto: concepto,
      monto: parseFloat(monto) || 0,
      medio: medio,
      fecha: new Date().toISOString(),
      usuario: AuthService?.getUser()?.email || 'sistema'
    };

    estado.movimientos.push(movimiento);

    if (tipo === 'ingreso') {
      estado.movimientosIngresos += movimiento.monto;
      if (medio === 'Efectivo') {
        estado.ventasEfectivo += movimiento.monto;
      } else if (medio === 'Transferencia') {
        estado.ventasTransferencia += movimiento.monto;
      } else if (medio === 'Débito' || medio === 'Debito') {
        estado.ventasDebito += movimiento.monto;
      } else if (medio === 'Crédito' || medio === 'Credito') {
        estado.ventasCredito += movimiento.monto;
      }
    } else if (tipo === 'egreso') {
      estado.movimientosEgresos += movimiento.monto;
      if (medio === 'Efectivo') {
        estado.ventasEfectivo -= movimiento.monto;
      }
    }

    estado.total = estado.ventasEfectivo + estado.ventasTransferencia + estado.ventasDebito + estado.ventasCredito;

    await DataStore.write(this.filename, estado);

    return movimiento;
  },

  async getMovimientos() {
    const estado = await this.getEstado();
    return estado.movimientos || [];
  },

  async getIngresosDelDia() {
    const hoy = new Date().toISOString().split('T')[0];
    const movimientos = await this.getMovimientos();
    return movimientos
      .filter(m => m.fecha.startsWith(hoy) && m.tipo === 'ingreso')
      .reduce((sum, m) => sum + m.monto, 0);
  },

  async getEgresosDelDia() {
    const hoy = new Date().toISOString().split('T')[0];
    const movimientos = await this.getMovimientos();
    return movimientos
      .filter(m => m.fecha.startsWith(hoy) && m.tipo === 'egreso')
      .reduce((sum, m) => sum + m.monto, 0);
  },

  async agregarVenta(venta) {
    const estado = await this.getEstado();
    if (!estado.abierta) return false;

    estado.ventas.push(venta);

    const mediosArray = Array.isArray(venta.mediosPago) ? venta.mediosPago : 
                      (venta.medioPago ? [{ medio: venta.medioPago, monto: venta.monto }] : []);
    
    for (const mp of mediosArray) {
      const monto = parseFloat(mp.monto) || 0;
      switch (mp.medio) {
        case 'Efectivo':
          estado.ventasEfectivo += monto;
          break;
        case 'Transferencia':
          estado.ventasTransferencia += monto;
          break;
        case 'Débito':
        case 'Debito':
          estado.ventasDebito += monto;
          break;
        case 'Crédito':
        case 'Credito':
          estado.ventasCredito += monto;
          break;
      }
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
    
    localStorage.removeItem(this.STORAGE_KEY);
    
    return estado;
  },

  async getResumen() {
    const estado = await this.getEstado();
    const diferencia = estado.saldoReal > 0 ? estado.saldoReal - estado.ventasEfectivo : null;

    return {
      saldoInicial: estado.saldoInicial,
      movimientosIngresos: estado.movimientosIngresos || 0,
      movimientosEgresos: estado.movimientosEgresos || 0,
      ventasEfectivo: estado.ventasEfectivo,
      ventasTransferencia: estado.ventasTransferencia,
      ventasDebito: estado.ventasDebito,
      ventasCredito: estado.ventasCredito,
      totalVentas: estado.total,
      saldoTeorico: estado.ventasEfectivo,
      saldoReal: estado.saldoReal,
      diferencia: diferencia,
      cantidadVentas: estado.ventas.length,
      movimientos: estado.movimientos || []
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