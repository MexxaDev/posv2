const TopNav = {
  currentPage: 'pos',
  
  render() {
    return `
      <nav class="top-nav">
        <div class="top-nav-brand">
          <span class="top-nav-logo">The West</span>
          <div class="top-nav-links">
            <a href="#pos" class="top-nav-link ${this.currentPage === 'pos' ? 'active' : ''}" data-page="pos">
              <i class="ti ti-point-of-sale"></i>
              POS
            </a>
            <a href="#dashboard" class="top-nav-link ${this.currentPage === 'dashboard' ? 'active' : ''}" data-page="dashboard">
              <i class="ti ti-chart-bar"></i>
              Dashboard
            </a>
          </div>
        </div>
        
        <div class="top-nav-user">
          <button class="top-nav-user-btn" id="userMenuBtn">
            <i class="ti ti-user"></i>
            <i class="ti ti-chevron-down"></i>
          </button>
          <div class="caja-indicador" id="cajaIndicador" title="Estado de caja">
            <span class="caja-dot" id="cajaDot"></span>
            <span class="caja-text" id="cajaText">Cargando...</span>
          </div>
          <div class="user-dropdown" id="userDropdown">
            <button class="user-dropdown-item danger" id="btnLogout">
              <i class="ti ti-logout"></i>
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>
    `;
  },
  
  setActive(page) {
    this.currentPage = page;
  },
  
  async updateCajaIndicador() {
    try {
      const cajaAbierta = await CajaService.estaAbierta();
      const resumen = await CajaService.getResumen();
      const dot = document.getElementById('cajaDot');
      const text = document.getElementById('cajaText');
      
      if (dot && text) {
        if (cajaAbierta) {
          dot.className = 'caja-dot open';
          text.textContent = `Caja: $${(resumen.saldoTeorico || 0).toLocaleString('es-AR')}`;
          text.title = 'Caja abierta';
        } else {
          dot.className = 'caja-dot closed';
          text.textContent = 'Caja cerrada';
          text.title = 'Caja cerrada';
        }
      }
    } catch (e) {
      const text = document.getElementById('cajaText');
      if (text) text.textContent = 'Sin datos';
    }
  },
  
  async refresh() {
    await this.updateCajaIndicador();
  },
  
  initEvents() {
    // Navigation links
    document.querySelectorAll('.top-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        this.setActive(page);
        Router.navigate(page);
      });
    });
    
    // User menu dropdown
    const userMenuBtn = document.getElementById('userMenuBtn');
    const userDropdown = document.getElementById('userDropdown');
    
    if (userMenuBtn && userDropdown) {
      userMenuBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        userDropdown.classList.toggle('active');
      });
      
      document.addEventListener('click', () => {
        userDropdown.classList.remove('active');
      });
      
      // Logout button
      document.getElementById('btnLogout')?.addEventListener('click', () => {
        AuthService.logout();
        Router.navigate('login');
      });
    }

    this.updateCajaIndicador();
  }
};

window.TopNav = TopNav;