const App = {
  async init() {
    await DataStore.init();

    Router.addRoute('login', () => this.renderLogin());
    Router.addRoute('pos', () => this.renderPOS());
    Router.addRoute('dashboard', () => this.renderDashboard());
    Router.addRoute('catalogo', () => this.renderCatalogo());

    Router.init();
  },

  renderLogin() {
    document.getElementById('app').innerHTML = '<div id="mainContent"></div>';
    LoginPage.render();
  },

  async renderPOS() {
    const topNav = TopNav.render();
    TopNav.setActive('pos');
    
    document.getElementById('app').innerHTML = `
      <div class="app-container">
        ${topNav}
        <div id="mainContent"></div>
      </div>
    `;
    TopNav.initEvents();
    
    const cajaAbierta = await CajaService.estaAbierta();
    if (!cajaAbierta) {
      await LoginPage.mostrarModalAperturaCaja();
    }
    
    await POSPage.init();
  },

  async renderDashboard() {
    if (!Router.requireAuth(null, 'admin')) return;

    const topNav = TopNav.render();
    TopNav.setActive('dashboard');
    
    document.getElementById('app').innerHTML = `
      <div class="app-container">
        ${topNav}
        <div id="mainContent"></div>
      </div>
    `;
    TopNav.initEvents();
    await DashboardPage.init();
  },

  async renderCatalogo() {
    if (!Router.requireAuth(null, 'admin')) return;

    const sidebar = Sidebar.render();
    const header = await Header.render();
    document.getElementById('app').innerHTML = `
      ${sidebar}
      <div class="main-area">
        ${header}
        <div id="mainContent"></div>
      </div>
    `;
    Sidebar.initEvents();
    Header.initEvents();
    await CatalogoPage.init();
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());