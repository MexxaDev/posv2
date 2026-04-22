const VentasService = {
  filename: 'ventas.json',

  async getAll() {
    return await DataStore.read(this.filename) || [];
  },

  async create(data) {
    const ventas = await this.getAll();
    const nueva = {
      idVenta: DataStore.generateId('venta'),
      clienteId: data.clienteId || null,
      cliente: data.cliente || 'Cliente Mostrador',
      items: data.items || [],
      mediosPago: data.mediosPago || [{ medio: data.medioPago || 'Efectivo', monto: data.monto }],
      descuento: data.descuento || 0,
      subtotal: data.subtotal,
      nota: data.nota || '',
      tipo: data.tipo || 'mostrador',
      monto: data.monto,
      medioPago: data.medioPago,
      fecha: data.fecha || new Date().toISOString(),
      usuario: data.usuario || 'sistema'
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
      if (v.mediosPago && Array.isArray(v.mediosPago)) {
        v.mediosPago.forEach(mp => {
          medios[mp.medio] = (medios[mp.medio] || 0) + (mp.monto || 0);
        });
      } else {
        const mp = v.medioPago || 'Otro';
        medios[mp] = (medios[mp] || 0) + (v.monto || 0);
      }
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

  async getVentasFiltradas(filtros = {}) {
    let ventas = await this.getAll();
    
    if (filtros.fechaInicio && filtros.fechaFin) {
      ventas = ventas.filter(v => {
        const fecha = v.fecha.split('T')[0];
        return fecha >= filtros.fechaInicio && fecha <= filtros.fechaFin;
      });
    }
    
    if (filtros.medioPago && filtros.medioPago.length > 0) {
      ventas = ventas.filter(v => {
        const medios = v.mediosPago?.map(mp => mp.medio) || [v.medioPago];
        return filtros.medioPago.some(mp => medios.includes(mp));
      });
    }
    
    if (filtros.cliente) {
      const busqueda = filtros.cliente.toLowerCase();
      ventas = ventas.filter(v => v.cliente?.toLowerCase().includes(busqueda));
    }
    
    if (filtros.montoMin !== undefined && filtros.montoMin !== null && filtros.montoMin !== '') {
      ventas = ventas.filter(v => v.monto >= filtros.montoMin);
    }
    
    if (filtros.montoMax !== undefined && filtros.montoMax !== null && filtros.montoMax !== '') {
      ventas = ventas.filter(v => v.monto <= filtros.montoMax);
    }
    
    return ventas;
  },

  async getTicketPromedio(filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    if (!ventas.length) return 0;
    const total = ventas.reduce((sum, v) => sum + v.monto, 0);
    return Math.round(total / ventas.length);
  },

  async getItemsPromedio(filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    if (!ventas.length) return 0;
    const totalItems = ventas.reduce((sum, v) => sum + (v.items?.length || 0), 0);
    return (totalItems / ventas.length).toFixed(1);
  },

  async getTopProductos(limit = 10, filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    const productos = {};
    ventas.forEach(v => {
      v.items?.forEach(item => {
        if (!productos[item.nombre]) {
          productos[item.nombre] = { nombre: item.nombre, cantidad: 0, monto: 0 };
        }
        productos[item.nombre].cantidad += item.cantidad;
        productos[item.nombre].monto += item.precio * item.cantidad;
      });
    });
    return Object.values(productos)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, limit);
  },

  async getTopClientes(limit = 10, filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    const clientes = {};
    ventas.forEach(v => {
      if (!clientes[v.cliente]) {
        clientes[v.cliente] = { nombre: v.cliente, ventas: 0, monto: 0 };
      }
      clientes[v.cliente].ventas++;
      clientes[v.cliente].monto += v.monto;
    });
    return Object.values(clientes)
      .sort((a, b) => b.monto - a.monto)
      .slice(0, limit);
  },

  async getVentasPorHora(filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    const porHora = Array(24).fill(0);
    ventas.forEach(v => {
      const hora = new Date(v.fecha).getHours();
      porHora[hora] += v.monto;
    });
    return porHora.map((monto, hora) => ({ hora, monto }));
  },

  async getVentasPorDiaSemana(filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    const porDia = Array(7).fill({ cantidad: 0, monto: 0 });
    ventas.forEach(v => {
      const dia = new Date(v.fecha).getDay();
      porDia[dia].cantidad++;
      porDia[dia].monto += v.monto;
    });
    return dias.map((dia, i) => ({ dia, cantidad: porDia[i].cantidad, monto: porDia[i].monto }));
  },

  async getIngresosPorRango(filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    return ventas.reduce((sum, v) => sum + v.monto, 0);
  },

  async getCantidadVentas(filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    return ventas.length;
  },

  generarCSV(filtros = {}) {
    const ventas = this._lastVentasFiltradas || [];
    let csv = 'ID,Fecha,Cliente,Items,Subtotal,Descuento,Monto,Método de Pago\n';
    ventas.forEach(v => {
      const mediosStr = v.mediosPago ? v.mediosPago.map(mp => `${mp.medio}:$${mp.monto}`).join(' + ') : v.medioPago;
      const itemsStr = v.items?.map(i => `${i.nombre}x${i.cantidad}`).join('; ') || '';
      csv += `${v.idVenta},${v.fecha},"${v.cliente}","${itemsStr}",${v.subtotal},${v.descuento},${v.monto},"${mediosStr}"\n`;
    });
    return csv;
  },

  async descargarCSV(filtros = {}) {
    this._lastVentasFiltradas = await this.getVentasFiltradas(filtros);
    const csv = this.generarCSV(filtros);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ventas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  },

  async generarReportePDF(filtros = {}) {
    const ventas = await this.getVentasFiltradas(filtros);
    const ticketProm = await this.getTicketPromedio(filtros);
    const itemsProm = await this.getItemsPromedio(filtros);
    const total = ventas.reduce((s, v) => s + v.monto, 0);
    const topProductos = await this.getTopProductos(5, filtros);
    const topClientes = await this.getTopClientes(5, filtros);
    
    const datosNegocio = typeof DatosNegocioService !== 'undefined' 
      ? await DatosNegocioService.get() 
      : { nombre: 'Mi Negocio' };
    
    let html = `
      <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto;">
        <h1 style="text-align: center; margin-bottom: 5px;">${datosNegocio.nombre}</h1>
        <h2 style="text-align: center; margin-bottom: 20px; color: #666;">Reporte de Ventas</h2>
        
        <div style="display: flex; justify-content: space-between; margin-bottom: 20px; padding: 15px; background: #f5f5f5; border-radius: 8px;">
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${ventas.length}</div>
            <div style="color: #666;">Ventas</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">$${total.toLocaleString('es-AR')}</div>
            <div style="color: #666;">Total</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">$${ticketProm.toLocaleString('es-AR')}</div>
            <div style="color: #666;">Ticket Prom.</div>
          </div>
          <div style="text-align: center;">
            <div style="font-size: 24px; font-weight: bold;">${itemsProm}</div>
            <div style="color: #666;">Items/Venta</div>
          </div>
        </div>
        
        ${filtros.fechaInicio ? `<p style="color: #666;">Período: ${filtros.fechaInicio} ${filtros.fechaFin ? 'al ' + filtros.fechaFin : ''}</p>` : ''}
        
        <h3 style="margin-top: 25px; border-bottom: 2px solid #6366f1;">Top 5 Productos</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px; text-align: left;">Producto</th>
            <th style="padding: 8px; text-align: right;">Cantidad</th>
            <th style="padding: 8px; text-align: right;">Monto</th>
          </tr>
          ${topProductos.map(p => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${p.nombre}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${p.cantidad}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${p.monto.toLocaleString('es-AR')}</td>
            </tr>
          `).join('')}
        </table>
        
        <h3 style="margin-top: 25px; border-bottom: 2px solid #6366f1;">Top 5 Clientes</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr style="background: #f0f0f0;">
            <th style="padding: 8px; text-align: left;">Cliente</th>
            <th style="padding: 8px; text-align: right;">Ventas</th>
            <th style="padding: 8px; text-align: right;">Total</th>
          </tr>
          ${topClientes.map(c => `
            <tr>
              <td style="padding: 8px; border-bottom: 1px solid #eee;">${c.nombre}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${c.ventas}</td>
              <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${c.monto.toLocaleString('es-AR')}</td>
            </tr>
          `).join('')}
        </table>
        
        <h3 style="margin-top: 25px; border-bottom: 2px solid #6366f1;">Detalle de Ventas</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
          <tr style="background: #f0f0f0;">
            <th style="padding: 6px; text-align: left;">Fecha</th>
            <th style="padding: 6px; text-align: left;">Cliente</th>
            <th style="padding: 6px; text-align: right;">Monto</th>
            <th style="padding: 6px; text-align: left;">Medio</th>
          </tr>
          ${ventas.slice(0, 20).map(v => `
            <tr>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">${new Date(v.fecha).toLocaleString('es-AR')}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">${v.cliente}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee; text-align: right;">$${v.monto.toLocaleString('es-AR')}</td>
              <td style="padding: 6px; border-bottom: 1px solid #eee;">${v.medioPago}</td>
            </tr>
          `).join('')}
          ${ventas.length > 20 ? `<tr><td colspan="4" style="padding: 8px; text-align: center; color: #666;">... y ${ventas.length - 20} ventas más</td></tr>` : ''}
        </table>
        
        <p style="margin-top: 30px; text-align: center; color: #999; font-size: 12px;">Generado el ${new Date().toLocaleString('es-AR')}</p>
      </div>
    `;
    
    const win = window.open('', '_blank');
    win.document.write('<html><head><title>Reporte de Ventas</title></head><body>' + html + '</body></html>');
    win.document.close();
    setTimeout(() => win.print(), 250);
  },

  async generarCSV() {
    const ventas = await this.getAll();
    let csv = 'ID,Fecha,Cliente,Monto,Métodos de Pago\n';
    ventas.forEach(v => {
      const mediosStr = v.mediosPago ? v.mediosPago.map(mp => `${mp.medio}:$${mp.monto}`).join(' + ') : v.medioPago;
      csv += `${v.idVenta},${v.fecha},"${v.cliente}",${v.monto},"${mediosStr}"\n`;
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
