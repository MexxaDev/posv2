const Sidebar = {
  render() {
    return `
      <div class="sidebar">
        <div class="sidebar-logo" id="logoContainer">
          <span class="logo-text">GG</span>
        </div>
        <nav class="sidebar-nav">
          <a href="#pos" class="sidebar-link active" data-page="pos">
            <i class="ti ti-shopping-cart"></i>
            <span>POS</span>
          </a>
          <a href="#dashboard" class="sidebar-link" data-page="dashboard">
            <i class="ti ti-layout-dashboard"></i>
            <span>Dashboard</span>
          </a>
          <a href="#catalogo" class="sidebar-link" data-page="catalogo">
            <i class="ti ti-packages"></i>
            <span>Catálogo</span>
          </a>
          <button class="sidebar-btn-logout" id="btnLogout">
            <i class="ti ti-logout"></i>
            <span>Salir</span>
          </button>
        </nav>
      </div>
    `;
  },

  initEvents() {
    const logoutBtn = document.getElementById('btnLogout');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        AuthService.logout();
        Router.navigate('login');
      });
    }
  }
};

window.Sidebar = Sidebar;
