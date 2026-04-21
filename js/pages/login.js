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
    document.getElementById('loginForm')?.addEventListener('submit', (e) => {
      e.preventDefault();
      const email = document.getElementById('loginEmail').value.trim();
      const password = document.getElementById('loginPassword').value;
      const errorMsg = document.getElementById('loginError');

      const result = AuthService.login(email, password);

      if (result.success) {
        errorMsg.style.display = 'none';
        window.location.hash = result.user.role === 'admin' ? 'dashboard' : 'pos';
      } else {
        errorMsg.style.display = 'block';
        document.getElementById('loginPassword').value = '';
      }
    });
  }
};

window.LoginPage = LoginPage;