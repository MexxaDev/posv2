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
    await POSPage.init();
  },

  async renderDashboard() {
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
    await CatalogoPage.init();
  }
};

window.App = App;

document.addEventListener('DOMContentLoaded', () => App.init());