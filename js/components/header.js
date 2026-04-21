const Header = {
  async render() {
    const nombreNegocio = await DatosNegocioService.getNombre();
    const user = AuthService.getUser();

    return `
      <header class="header">
        <div class="header-left">
          <h1 class="header-greeting">Buen día, ${nombreNegocio} 👋</h1>
        </div>
        <div class="header-center">
          <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input type="text" id="buscador" placeholder="Buscar...">
          </div>
        </div>
        <div class="header-right">
          <div class="user-info">
            <span class="user-name">${user?.email || 'Usuario'}</span>
            <span class="user-role">${user?.role === 'admin' ? 'Admin' : 'Cajero'}</span>
          </div>
          <div class="user-avatar">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
        </div>
      </header>
    `;
  }
};

window.Header = Header;
