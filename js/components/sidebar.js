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
          <div class="sidebar-divider"></div>
          <button class="sidebar-link" id="btnExport" title="Exportar datos">
            <i class="ti ti-download"></i>
            <span>Exportar</span>
          </button>
          <button class="sidebar-link" id="btnImport" title="Importar datos">
            <i class="ti ti-upload"></i>
            <span>Importar</span>
          </button>
          <div class="sidebar-divider"></div>
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

    const exportBtn = document.getElementById('btnExport');
    if (exportBtn) {
      exportBtn.addEventListener('click', async () => {
        if (confirm('¿Exportar todos los datos? Se descargará un archivo JSON.')) {
          const success = await BackupService.exportData();
          if (success) {
            alert('Datos exportados correctamente.');
          } else {
            alert('Error al exportar datos.');
          }
        }
      });
    }

    const importBtn = document.getElementById('btnImport');
    if (importBtn) {
      importBtn.addEventListener('click', () => {
        if (confirm('⚠️ IMPORTANTE: Los datos actuales se reemplazarán con los del archivo.\n\n¿Continuar?')) {
          BackupService.showImportDialog();
        }
      });
    }
  }
};

window.Sidebar = Sidebar;
