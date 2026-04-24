const Header = {
  async render() {
    const nombreNegocio = await DatosNegocioService.getNombre();
    const user = AuthService.getUser();
    const cajaAbierta = await CajaService.estaAbierta();

    return `
      <header class="header">
        <div class="header-left">
          <h1 class="header-greeting">Buen día, ${nombreNegocio} 👋</h1>
        </div>
        <div class="header-center">
          <div class="search-box">
            <i class="ti ti-search"></i>
            <input type="text" id="buscador" placeholder="Buscar...">
          </div>
        </div>
        <div class="header-right">
          ${cajaAbierta ? `
            <button class="header-btn-caja" id="btnCerrarCaja" title="Cerrar Caja">
              <i class="ti ti-cash"></i>
              <span>Cerrar Caja</span>
            </button>
          ` : ''}
          <div class="user-menu-container">
            <div class="user-avatar" id="userAvatar">
              <i class="ti ti-user"></i>
            </div>
            <div class="user-dropdown" id="userDropdown">
              <button class="dropdown-item" id="btnDashboard">
                <i class="ti ti-layout-dashboard"></i>
                <span>Dashboard</span>
              </button>
              <button class="dropdown-item" id="btnCerrarSesion">
                <i class="ti ti-logout"></i>
                <span>Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      </header>
    `;
  },

  async initEvents() {
    const btnCerrar = document.getElementById('btnCerrarCaja');
    if (btnCerrar) {
      btnCerrar.addEventListener('click', () => this.mostrarModalCierreCaja());
    }

    const userAvatar = document.getElementById('userAvatar');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userAvatar && userDropdown) {
      userAvatar.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('show');
      });

      document.addEventListener('click', () => {
        userDropdown.classList.remove('show');
      });
    }

    const btnDashboard = document.getElementById('btnDashboard');
    if (btnDashboard) {
      btnDashboard.addEventListener('click', () => {
        Router.navigate('dashboard');
      });
    }

    const btnCerrarSesion = document.getElementById('btnCerrarSesion');
    if (btnCerrarSesion) {
      btnCerrarSesion.addEventListener('click', () => {
        AuthService.logout();
        Router.navigate('login');
      });
    }
  },

  async mostrarModalCierreCaja() {
    const resumen = await CajaService.getResumen();
    const estado = await CajaService.getEstado();

    const content = `
      <div class="cierre-caja-modal">
        <div class="cierre-header">
          <h2>💰 Cierre de Caja</h2>
          <p class="text-muted">${new Date().toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        <div class="cierre-resumen">
          <div class="cierre-row">
            <span>Saldo Inicial</span>
            <span>$${resumen.saldoInicial.toLocaleString('es-AR')}</span>
          </div>
          <div class="cierre-row">
            <span>Efectivo</span>
            <span>$${resumen.ventasEfectivo.toLocaleString('es-AR')}</span>
          </div>
          <div class="cierre-row">
            <span>Transferencia</span>
            <span>$${resumen.ventasTransferencia.toLocaleString('es-AR')}</span>
          </div>
          <div class="cierre-row">
            <span>Débito</span>
            <span>$${resumen.ventasDebito.toLocaleString('es-AR')}</span>
          </div>
          <div class="cierre-row">
            <span>Crédito</span>
            <span>$${resumen.ventasCredito.toLocaleString('es-AR')}</span>
          </div>
          <div class="cierre-divider"></div>
          <div class="cierre-row total">
            <span>Total Ventas</span>
            <span>$${resumen.totalVentas.toLocaleString('es-AR')}</span>
          </div>
          <div class="cierre-row total">
            <span>Saldo Teórico</span>
            <span>$${resumen.saldoTeorico.toLocaleString('es-AR')}</span>
          </div>
        </div>

        <form id="cierreCajaForm" class="cierre-form">
          <div class="input-group">
            <label>Saldo Real (opcional)</label>
            <input type="number" id="saldoReal" placeholder="Ingresa el saldo contado">
          </div>
        </form>

        <div id="cierreDiferencia"></div>
      </div>
    `;

    const buttons = [
      { id: 'btnWhatsApp', text: '📱 WhatsApp', type: 'secondary' },
      { id: 'btnCSV', text: '📄 CSV', type: 'secondary' },
      { id: 'btnCerrar', text: '✅ Cerrar Caja', type: 'primary' }
    ];

    const modal = Modal.show({
      title: 'Cierre de Caja',
      content,
      buttons
    });

    document.getElementById('saldoReal')?.addEventListener('input', (e) => {
      const saldoReal = parseFloat(e.target.value) || 0;
      const diferencia = saldoReal - resumen.saldoTeorico;
      const diffEl = document.getElementById('cierreDiferencia');
      if (diffEl) {
        const diffSign = diferencia >= 0 ? '+' : '';
        diffEl.innerHTML = `
          <div class="cierre-row total ${diferencia < 0 ? 'negativo' : diferencia > 0 ? 'positivo' : ''}">
            <span>Diferencia</span>
            <span>${diffSign}$${diferencia.toLocaleString('es-AR')}</span>
          </div>
        `;
      }
    });

    document.getElementById('btnWhatsApp')?.addEventListener('click', async () => {
      await WhatsAppService.enviarCierre(estado, estado.ventas);
    });

    document.getElementById('btnCSV')?.addEventListener('click', async () => {
      await CajaService.descargarCSV();
    });

    document.getElementById('btnCerrar')?.addEventListener('click', async () => {
      const saldoReal = document.getElementById('saldoReal')?.value || 0;
      await CajaService.cerrar(saldoReal);
      if (typeof window.TopNav !== 'undefined') {
        await window.TopNav.updateCajaIndicador();
      }
      Modal.close(modal);
      Modal.alert('Caja cerrada correctamente', 'success');
    });
  }
};

window.Header = Header;