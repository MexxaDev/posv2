const Router = {
  routes: {},
  currentRoute: null,

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  },

  addRoute(path, handler) {
    this.routes[path] = handler;
  },

  navigate(path) {
    window.location.hash = path;
  },

  handleRoute() {
    const hash = window.location.hash.slice(1) || 'pos';
    const route = this.routes[hash];

    if (route) {
      this.currentRoute = hash;
      route();
    } else {
      this.navigate('pos');
    }

    this.updateActiveLink();
  },

  updateActiveLink() {
    document.querySelectorAll('.sidebar-link').forEach(link => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('active', href === this.currentRoute);
    });
  },

  isAuthenticated() {
    return AuthService.isAuthenticated();
  },

  requireAuth(callback, requiredRole = 'cajero') {
    if (!this.isAuthenticated()) {
      this.navigate('login');
      return false;
    }

    const user = AuthService.getUser();
    if (requiredRole === 'admin' && user?.role !== 'admin') {
      this.navigate('pos');
      return false;
    }

    return true;
  }
};

window.Router = Router;
