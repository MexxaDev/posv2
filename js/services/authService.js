const AuthService = {
  USERS: {
    admin: { email: 'admin@gmail.com', password: '123456', role: 'admin' },
    cajero: { email: 'cajero', password: '1234', role: 'cajero' }
  },

  currentUser: null,

  login(email, password) {
    const user = Object.values(this.USERS).find(
      u => (u.email === email || u.email === password) && u.password === password
    );

    if (user) {
      this.currentUser = { email: user.email, role: user.role };
      localStorage.setItem('pos_auth', JSON.stringify(this.currentUser));
      return { success: true, user: this.currentUser };
    }
    return { success: false, error: 'Credenciales incorrectas' };
  },

  logout() {
    this.currentUser = null;
    localStorage.removeItem('pos_auth');
  },

  isAuthenticated() {
    const stored = localStorage.getItem('pos_auth');
    if (stored) {
      this.currentUser = JSON.parse(stored);
      return true;
    }
    return false;
  },

  getUser() {
    return this.currentUser;
  },

  isAdmin() {
    return this.currentUser?.role === 'admin';
  },

  canAccessDashboard() {
    return this.currentUser?.role === 'admin';
  }
};

window.AuthService = AuthService;
