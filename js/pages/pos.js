const POSPage = {
  articulos: [],
  carrito: [],
  categorias: [],
  categoriaActual: 'todos',
  mediosPago: [],

  async init() {
    this.articulos = await ArticulosService.getAll();
    this.categorias = await ArticulosService.getCategorias();
    this.mediosPago = await MediosPagoService.getNombres();
    this.render();
    this.setupEvents();
  },

  render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="pos-page">
        <section class="categorias-section">
          <div class="categorias-container" id="categoriasContainer"></div>
        </section>
        <div class="pos-content">
          <section class="productos-section">
            <div class="productos-grid" id="productosGrid"></div>
          </section>
          <aside class="orden-panel">
            <div class="orden-header">
              <h3>Pedido Actual</h3>
              <span class="orden-count" id="ordenCount">0 productos</span>
            </div>
            <div class="orden-items" id="ordenItems"></div>
            <div class="orden-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span id="subtotal">$0</span>
              </div>
              <div class="summary-row">
                <span>Tax (10%)</span>
                <span id="tax">$0</span>
              </div>
              <div class="summary-row total">
                <span>Total</span>
                <span id="totalOrden">$0</span>
              </div>
            </div>
            <div class="orden-actions">
              <button id="btnCobrar" class="btn btn-primary btncobrar">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
                  <line x1="1" y1="10" x2="23" y2="10"></line>
                </svg>
                Cobrar
              </button>
              <button id="btnLimpiar" class="btn btn-secondary">Limpiar</button>
            </div>
            <div class="orden-extras">
              <div class="medio-pago">
                <label>Método de Pago</label>
                <select id="medioPago"></select>
              </div>
            </div>
          </aside>
        </div>
      </div>
    `;

    this.renderCategorias();
    this.renderProductos();
    this.renderMediosPago();
    this.renderOrden();
  },

  renderCategorias() {
    const container = document.getElementById('categoriasContainer');
    const labels = {
      todos: 'Todo',
      bebidas: 'Bebidas',
      promos: 'Promos',
      combos: 'Combos',
      extras: 'Extras',
      hamburguesas: 'Hamburguesas'
    };

    container.innerHTML = this.categorias.map(cat => `
      <button class="categoria-btn ${cat === this.categoriaActual ? 'active' : ''}" data-categoria="${cat}">
        ${labels[cat] || cat}
      </button>
    `).join('');
  },

  renderProductos() {
    const grid = document.getElementById('productosGrid');
    let filtrados = this.articulos;

    if (this.categoriaActual !== 'todos') {
      filtrados = filtrados.filter(a => a.categoria === this.categoriaActual);
    }

    const busqueda = document.getElementById('buscador')?.value?.toLowerCase() || '';
    if (busqueda) {
      filtrados = filtrados.filter(a =>
        a.nombre.toLowerCase().includes(busqueda) ||
        a.codigo.toLowerCase().includes(busqueda)
      );
    }

    if (filtrados.length === 0) {
      grid.innerHTML = '<div class="empty-state"><p>No hay productos</p></div>';
      return;
    }

    grid.innerHTML = filtrados.map(a => `
      <div class="producto-card" data-codigo="${a.codigo}">
        <div class="producto-imagen">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
        </div>
        <div class="producto-nombre">${a.nombre}</div>
        <div class="producto-precio">${this.formatPrecio(a.precio)}</div>
        <div class="producto-stock">Stock: ${a.stock}</div>
      </div>
    `).join('');
  },

  renderOrden() {
    const container = document.getElementById('ordenItems');
    const subtotal = this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
    const tax = Math.round(subtotal * 0.1);
    const total = subtotal + tax;

    if (this.carrito.length === 0) {
      container.innerHTML = `
        <div class="orden-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
            <line x1="9" y1="9" x2="9.01" y2="9"></line>
            <line x1="15" y1="9" x2="15.01" y2="9"></line>
          </svg>
          <p>El carrito está vacío</p>
        </div>
      `;
    } else {
      container.innerHTML = this.carrito.map((item, index) => `
        <div class="orden-item">
          <div class="orden-item-info">
            <div class="orden-item-nombre">${item.nombre}</div>
            <div class="orden-item-precio">${this.formatPrecio(item.precio)}</div>
          </div>
          <div class="orden-item-cant">
            <button data-action="disminuir" data-index="${index}">-</button>
            <span>${item.cantidad}</span>
            <button data-action="aumentar" data-index="${index}">+</button>
          </div>
          <button class="orden-item-delete" data-index="${index}">&times;</button>
        </div>
      `).join('');
    }

    document.getElementById('subtotal').textContent = this.formatPrecio(subtotal);
    document.getElementById('tax').textContent = this.formatPrecio(tax);
    document.getElementById('totalOrden').textContent = this.formatPrecio(total);
    document.getElementById('ordenCount').textContent = `${this.carrito.reduce((s, i) => s + i.cantidad, 0)} productos`;
  },

  renderMediosPago() {
    const select = document.getElementById('medioPago');
    select.innerHTML = this.mediosPago.map(mp => `<option value="${mp}">${mp}</option>`).join('');
  },

  setupEvents() {
    document.getElementById('categoriasContainer')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.categoria-btn');
      if (btn) {
        this.categoriaActual = btn.dataset.categoria;
        this.renderCategorias();
        this.renderProductos();
      }
    });

    document.getElementById('productosGrid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.producto-card');
      if (card) {
        this.agregarProducto(card.dataset.codigo);
      }
    });

    document.getElementById('ordenItems')?.addEventListener('click', (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const index = parseInt(btn.dataset.index);
      const action = btn.dataset.action;

      if (action === 'aumentar') {
        this.carrito[index].cantidad++;
      } else if (action === 'disminuir') {
        this.carrito[index].cantidad--;
        if (this.carrito[index].cantidad <= 0) {
          this.carrito.splice(index, 1);
        }
      } else if (btn.classList.contains('orden-item-delete')) {
        this.carrito.splice(index, 1);
      }

      this.renderOrden();
    });

    document.getElementById('btnLimpiar')?.addEventListener('click', () => {
      this.carrito = [];
      this.renderOrden();
    });

    document.getElementById('btnCobrar')?.addEventListener('click', () => this.procesarVenta());

    document.getElementById('buscador')?.addEventListener('input', () => {
      this.renderProductos();
    });
  },

  async agregarProducto(codigo) {
    const articulo = this.articulos.find(a => a.codigo === codigo);
    if (!articulo) return;

    const existente = this.carrito.find(p => p.codigo === codigo);
    if (existente) {
      existente.cantidad++;
    } else {
      this.carrito.push({
        id: articulo.id,
        codigo: articulo.codigo,
        nombre: articulo.nombre,
        precio: articulo.precio,
        cantidad: 1
      });
    }

    this.renderOrden();
    Modal.alert(`Agregado: ${articulo.nombre}`, 'success');
  },

  async procesarVenta() {
    if (this.carrito.length === 0) {
      Modal.alert('El carrito está vacío', 'error');
      return;
    }

    const medioPago = document.getElementById('medioPago').value;
    const monto = this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);

    const venta = {
      cliente: 'Cliente Mostrador',
      monto: monto,
      medioPago: medioPago,
      fecha: new Date().toISOString(),
      items: [...this.carrito]
    };

    await VentasService.create(venta);

    for (const item of this.carrito) {
      await ArticulosService.updateStock(item.id, -item.cantidad);
    }

    this.articulos = await ArticulosService.getAll();

    this.carrito = [];
    this.renderOrden();
    this.renderProductos();

    Modal.alert('Venta registrada correctamente', 'success');
  },

  formatPrecio(valor) {
    return '$' + valor.toLocaleString('es-AR');
  }
};

window.POSPage = POSPage;
