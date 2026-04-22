const TopNav = {
  currentPage: 'pos',
  
  render() {
    return `
      <nav class="top-nav">
        <div class="top-nav-brand">
          <span class="top-nav-logo">GG Beach</span>
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
  }
};

window.TopNav = TopNav;