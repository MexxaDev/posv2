const WhatsAppService = {
  async getPhoneNumber() {
    const datos = await DatosNegocioService.get();
    return datos.whatsapp || '543496578813';
  },

  async generarMensajeCierre(caja, ventas) {
    const datos = await DatosNegocioService.get();
    const nombreNegocio = datos.nombre || 'Mi Negocio';
    const fecha = new Date().toLocaleDateString('es-AR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    let mensaje = `*📦 CIERRE DE CAJA*%0A`;
    mensaje += `📅 ${nombreNegocio}%0A`;
    mensaje += `📅 Fecha: ${fecha}%0A%0A`;
    mensaje += `*💵 SALDO INICIAL:* $${caja.saldoInicial.toLocaleString('es-AR')}%0A%0A`;
    mensaje += `*📊 VENTAS:*%0A`;
    mensaje += `   Efectivo: $${caja.ventasEfectivo.toLocaleString('es-AR')}%0A`;
    mensaje += `   Transferencia: $${caja.ventasTransferencia.toLocaleString('es-AR')}%0A`;
    mensaje += `   Débito: $${caja.ventasDebito.toLocaleString('es-AR')}%0A`;
    mensaje += `   Crédito: $${caja.ventasCredito.toLocaleString('es-AR')}%0A%0A`;
    mensaje += `*🧾 TOTAL VENTAS:* $${caja.total.toLocaleString('es-AR')}%0A%0A`;

    const saldoTeorico = caja.saldoInicial + caja.ventasEfectivo;
    mensaje += `*💰 SALDO TEÓRICO:* $${saldoTeorico.toLocaleString('es-AR')}%0A`;

    if (caja.saldoReal > 0) {
      const diferencia = caja.saldoReal - saldoTeorico;
      mensaje += `*💵 SALDO REAL:* $${caja.saldoReal.toLocaleString('es-AR')}%0A`;
      mensaje += `*📈 DIFERENCIA:* ${diferencia >= 0 ? '+' : ''}$${diferencia.toLocaleString('es-AR')}%0A`;
    }

    mensaje += `%0A*✅ CAJA CERRADA*`;

    return mensaje;
  },

  async enviarCierre(caja, ventas) {
    const telefono = await this.getPhoneNumber();
    const mensaje = await this.generarMensajeCierre(caja, ventas);
    const url = `https://api.whatsapp.com/send?phone=${telefono}&text=${mensaje}`;
    window.open(url, '_blank');
  }
};

window.WhatsAppService = WhatsAppService;