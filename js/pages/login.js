const LoginPage = {
  render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="login-page">
        <div class="login-card">
          <div class="login-logo">
            <span>GG</span>
          </div>
          <h1>GG BEACH HOUSE</h1>
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

  async mostrarModalAperturaCaja() {
    const content = `
      <div class="apertura-caja-modal">
        <div class="apertura-icon">💰</div>
        <h2>Apertura de Caja</h2>
        <p class="text-muted">Ingresa el saldo inicial de la caja para comenzar el día</p>

        <form id="aperturaCajaForm">
          <div class="input-group">
            <label>Saldo Inicial ($)</label>
            <input type="number" id="saldoInicial" placeholder="0" required min="0">
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
      await CajaService.abrir(saldoInicial || 0);

      const user = AuthService.getUser();
      window.location.hash = user?.role === 'admin' ? 'dashboard' : 'pos';
    });

    setTimeout(() => document.getElementById('saldoInicial')?.focus(), 100);
  }
};

window.LoginPage = LoginPage;