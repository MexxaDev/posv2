const LoginPage = {
  render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <span>TW</span>
          </div>
          <h1>The West</h1>
          <p class="login-subtitle">Iniciar Sesión</p>

          <form id="loginForm" class="login-form">
            <div class="input-group">
              <label for="loginEmail">Usuario / Email</label>
              <input type="text" id="loginEmail" placeholder="admin o cajero" required>
            </div>

            <div class="input-group">
              <label for="loginPassword">Contraseña</label>
              <input type="password" id="loginPassword" placeholder="123456 o 1234" required>
            </div>

            <p id="loginError" class="login-error" style="display: none;">Credenciales incorrectas</p>

            <button type="submit" class="btn btn-primary btn-login">INICIAR SESIÓN</button>
          </form>

          <div class="login-hint">
            <p>Credenciales:</p>
            <small>Admin: admin@gmail.com / 123456</small><br>
            <small>Cajero: cajero / 1234</small>
          </div>
        </div>
      </div>
    `;

    this.setupEvents();
  },

  setupEvents() {
    document.getElementById('loginForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorMsg = document.getElementById('loginError');

      const result = AuthService.login(email, password);

      if (result.success) {
        errorMsg.style.display = 'none';

        const cajaAbierta = await CajaService.estaAbierta();

        if (!cajaAbierta) {
          await this.mostrarModalAperturaCaja();
        } else {
          window.location.hash = result.user.role === 'admin' ? 'dashboard' : 'pos';
        }
      } else {
        errorMsg.style.display = 'block';
        document.getElementById('loginPassword').value = '';
      }
    });
  },

  async mostrarModalAperturaCaja(modalActual = null) {
    if (modalActual) {
      Modal.close(modalActual);
    }

    const content = `
      <div class="apertura-caja-modal">
        <div class="apertura-icon">💰</div>
        <h2>Apertura de Caja</h2>
        <p class="text-muted">Ingresa el saldo inicial de la caja para comenzar el día</p>

        <form id="aperturaCajaForm">
          <div class="input-group" style="text-align: left;">
            <label>Saldo Inicial ($)</label>
            <input type="number" id="saldoInicial" placeholder="0" required min="0" style="font-size: 18px; padding: 14px;">
          </div>
        </form>
      </div>
    `;

    const buttons = [
      { id: 'btnAbrirCaja', text: 'Abrir Caja', type: 'primary' }
    ];

    const modal = Modal.show({
      title: 'Nueva Jornada',
      content,
      buttons
    });

    document.getElementById('btnAbrirCaja')?.addEventListener('click', async () => {
      const saldoInicial = document.getElementById('saldoInicial').value;
      const monto = parseFloat(saldoInicial) || 0;

      const estadoCaja = await CajaService.abrir(saldoInicial || 0);

      if (monto > 0) {
        const movimientoVenta = {
          clienteId: null,
          cliente: 'Sistema - Apertura de Caja',
          articulos: [],
          items: 0,
          mediosPago: [{ medio: 'Efectivo', monto: monto }],
          descuento: 0,
          subtotal: monto,
          nota: 'Apertura de caja - Saldo inicial',
          tipo: 'movimiento_caja',
          monto: monto,
          montoTotal: monto,
          fecha: new Date().toISOString(),
          usuario: AuthService?.getUser()?.email || 'sistema',
          movimientoTipo: 'ingreso',
          movimientoConcepto: 'Saldo inicial de caja'
        };
        await VentasService.create(movimientoVenta);
      }

      Modal.close(modal);

      const user = AuthService.getUser();
      window.location.hash = user?.role === 'admin' ? 'dashboard' : 'pos';
    });

    setTimeout(() => document.getElementById('saldoInicial')?.focus(), 100);
  }
};

window.LoginPage = LoginPage;