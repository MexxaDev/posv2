const POSPage = {
  articulos: [],
  carrito: [],
  categorias: [],
  categoriaActual: 'todos',
  mediosPago: [],
  clienteActual: null,
  descuento: { tipo: 'monto', valor: 0 },
  nota: '',
  notaVisible: false,
  descuentoVisible: false,
  mediosPagoSeleccionados: [],

async init() {
    try {
      await DataStore.init();
      this.articulos = await ArticulosService.getAll();
      this.categorias = await ArticulosService.getCategorias();
      this.mediosPago = await MediosPagoService.getNombres();
      
      let clientes = await ClientesService.getAll();
      let consumidorFinal = clientes.find(c => c.nombreCliente === 'Consumidor Final');
      
      if (!consumidorFinal) {
        consumidorFinal = await ClientesService.create({
          nombreCliente: 'Consumidor Final',
          telefono: '',
          direccion: ''
        });
      }
      
      if (consumidorFinal) {
        this.clienteActual = consumidorFinal;
      }
      
      this.mediosPagoSeleccionados = [{ medio: this.mediosPago[0] || 'Efectivo', monto: 0 }];
      
      this.render();
      this.setupEvents();
    } catch (e) {
      console.error('POSPage init ERROR:', e);
      const main = document.getElementById('mainContent');
      if (main) {
        main.innerHTML = '<div class="error-message">Error al cargar POS: ' + e.message + '</div>';
      }
    }
  },

  getSubtotal() {
    return this.carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
  },

  getDescuento() {
    if (this.descuento.tipo === 'porcentaje') {
      return Math.round(this.getSubtotal() * (this.descuento.valor / 100));
    }
    return this.descuento.valor;
  },

  getTotal() {
    return this.getSubtotal() - this.getDescuento();
  },

  getPagoTotal() {
    return this.mediosPagoSeleccionados.reduce((sum, mp) => sum + mp.monto, 0);
  },

  getVuelto() {
    return Math.max(0, this.getPagoTotal() - this.getTotal());
  },

  sincronizarPago() {
    if (this.mediosPagoSeleccionados.length === 1) {
      this.mediosPagoSeleccionados[0].monto = this.getTotal();
    }
  },

  render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="pos-layout">
        <div class="pos-main">
          <div class="category-pills" id="categoriasContainer"></div>
          
          <div class="pos-search">
            <i class="ti ti-search"></i>
            <input type="text" id="buscador" placeholder="Buscar productos...">
          </div>
          
          <div class="product-grid" id="productosGrid"></div>
        </div>
        
        <aside class="order-panel">
          <div class="order-panel-header">
            <h3 class="order-panel-title">
              <i class="ti ti-shopping-cart"></i>
              Pedido Actual
            </h3>
            <button class="btn-movimiento-caja" id="btnMovimientoCaja" title="Movimiento de Caja">
              <i class="ti ti-cash"></i>
            </button>
            <button class="btn-cerrar-caja-header" id="btnCerrarCajaHeader" title="Cerrar Caja">
              <i class="ti ti-logout"></i>
            </button>
          </div>
          
          <div class="orden-cliente-apple">
            <button class="cliente-btn" id="btnSeleccionarCliente">
              <i class="ti ti-user"></i>
              <span id="clienteNombre">${this.clienteActual?.nombreCliente || 'Sin cliente'}</span>
            </button>
          </div>

          <div class="order-panel-items" id="ordenItems"></div>
          
          <div class="order-panel-summary">
            <div class="order-summary-row">
              <span>Subtotal</span>
              <span id="subtotalOrden">${this.formatPrecio(this.getSubtotal())}</span>
            </div>
            <div class="order-summary-row discount-row" id="discountSummaryRow" style="display: ${this.getDescuento() > 0 ? 'flex' : 'none'}">
              <span>Descuento</span>
              <span class="text-error" id="descuentoSummary">-${this.formatPrecio(this.getDescuento())}</span>
            </div>
            <div class="order-summary-row total">
              <span>Total</span>
              <span id="totalOrden">${this.formatPrecio(this.getTotal())}</span>
            </div>
            <div class="order-summary-row items-count">
              <span id="ordenCount">${this.carrito.reduce((s, i) => s + i.cantidad, 0)} items</span>
            </div>
          </div>

          <div class="orden-extras-toggle">
            <button class="btn-toggle ${this.notaVisible ? 'active' : ''}" id="btnToggleNota">
              <i class="ti ti-note"></i>
              Nota
            </button>
            <button class="btn-toggle ${this.descuentoVisible ? 'active' : ''}" id="btnToggleDescuento">
              <i class="ti ti-discount"></i>
              Desc.
            </button>
          </div>

          <div class="orden-extras-content">
            <div class="extra-panel nota-panel" id="notaPanel" style="display: ${this.notaVisible ? 'block' : 'none'}">
              <input type="text" id="notaPedido" placeholder="Nota (ej: sin cebolla...)" value="${this.nota}">
            </div>
            
            <div class="extra-panel descuento-panel" id="descuentoPanel" style="display: ${this.descuentoVisible ? 'block' : 'none'}">
              <div class="descuento-inputs">
                <select id="descuentoTipo">
                  <option value="monto" ${this.descuento.tipo === 'monto' ? 'selected' : ''}>$</option>
                  <option value="porcentaje" ${this.descuento.tipo === 'porcentaje' ? 'selected' : ''}>%</option>
                </select>
                <input type="number" id="descuentoValor" value="${this.descuento.valor}" min="0" placeholder="0">
              </div>
            </div>

            <div class="extra-panel">
              <label class="pago-label">
                <i class="ti ti-credit-card"></i>
                Método de Pago
              </label>
              <div id="mediosPagoContainer"></div>
              <button class="btn-add-medio" id="btnAgregarMedio">
                <i class="ti ti-plus"></i>
                Agregar otro medio de pago
              </button>
              <div class="pago-validation" id="pagoValidation"></div>
            </div>
          </div>

          <div class="order-panel-actions">
            <button id="btnCobrar" class="apple-btn apple-btn-primary">
              <i class="ti ti-cash"></i>
              Cobrar ${this.formatPrecio(this.getTotal())}
            </button>
            <button id="btnLimpiar" class="apple-btn apple-btn-secondary">
              <i class="ti ti-trash"></i>
              Limpiar
            </button>
          </div>
        </aside>
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
      <button class="category-pill ${cat === this.categoriaActual ? 'active' : ''}" data-categoria="${cat}">
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
      <div class="product-card-apple" data-codigo="${a.codigo}">
        <div class="product-card-apple-img">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
        </div>
        <div class="product-card-apple-name">${a.nombre}</div>
        <div class="product-card-apple-price">${this.formatPrecio(a.precio)}</div>
      </div>
    `).join('');
  },

  renderOrden() {
    const container = document.getElementById('ordenItems');
    const subtotal = this.getSubtotal();
    const descuento = this.getDescuento();
    const total = this.getTotal();

    if (this.carrito.length === 0) {
      container.innerHTML = `
        <div class="order-empty">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M8 14s1.5 2 4 2 4-2 4-2"></path>
          </svg>
          <p>El carrito está vacío</p>
        </div>
      `;
    } else {
      container.innerHTML = this.carrito.map((item, index) => `
        <div class="order-item-apple">
          <div class="order-item-info">
            <div class="order-item-name">${item.nombre}</div>
            <div class="order-item-price">${this.formatPrecio(item.precio)} x ${item.cantidad}</div>
          </div>
          <div class="order-item-controls">
            <button class="order-item-btn" data-action="disminuir" data-index="${index}">
              <i class="ti ti-minus"></i>
            </button>
            <span class="order-item-qty">${item.cantidad}</span>
            <button class="order-item-btn" data-action="aumentar" data-index="${index}">
              <i class="ti ti-plus"></i>
            </button>
            <button class="order-item-delete" data-index="${index}">
              <i class="ti ti-x"></i>
            </button>
          </div>
        </div>
      `).join('');
    }

    const subtotalEl = document.getElementById('subtotalOrden');
    const descuentoRow = document.getElementById('discountSummaryRow');
    const descuentoEl = document.getElementById('descuentoSummary');
    const totalEl = document.getElementById('totalOrden');
    const ordenCount = document.getElementById('ordenCount');
    const btnCobrar = document.getElementById('btnCobrar');

    if (subtotalEl) subtotalEl.textContent = this.formatPrecio(subtotal);
    if (descuentoRow) descuentoRow.style.display = descuento > 0 ? 'flex' : 'none';
    if (descuentoEl) descuentoEl.textContent = `-${this.formatPrecio(descuento)}`;
    if (totalEl) totalEl.textContent = this.formatPrecio(total);
    if (ordenCount) ordenCount.textContent = `${this.carrito.reduce((s, i) => s + i.cantidad, 0)} items`;
    if (btnCobrar) btnCobrar.innerHTML = `<i class="ti ti-cash"></i> Cobrar ${this.formatPrecio(total)}`;
  },

  renderMediosPago() {
    const container = document.getElementById('mediosPagoContainer');
    if (!container) return;

    this.sincronizarPago();

    container.innerHTML = this.mediosPagoSeleccionados.map((mp, index) => `
      <div class="medio-pago-item">
        <select class="medio-pago-select" data-index="${index}">
          ${this.mediosPago.map(m => `<option value="${m}" ${m === mp.medio ? 'selected' : ''}>${m}</option>`).join('')}
        </select>
        <input type="number" class="medio-pago-monto" data-index="${index}" value="${index === 0 && this.mediosPagoSeleccionados.length === 1 ? this.getTotal() : mp.monto}" min="0" placeholder="Monto" ${index === 0 && this.mediosPagoSeleccionados.length === 1 ? 'readonly' : ''}>
        ${this.mediosPagoSeleccionados.length > 1 ? `<button class="btn-remove-medio" data-index="${index}"><i class="ti ti-x"></i></button>` : ''}
      </div>
    `).join('');
  },

  setupEvents() {
    document.getElementById('categoriasContainer')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.category-pill');
      if (btn) {
        this.categoriaActual = btn.dataset.categoria;
        this.renderCategorias();
        this.renderProductos();
      }
    });

    document.getElementById('productosGrid')?.addEventListener('click', (e) => {
      const card = e.target.closest('.product-card-apple');
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
      } else if (btn.classList.contains('order-item-delete')) {
        this.carrito.splice(index, 1);
      }

      this.renderOrden();
    });

    document.getElementById('btnLimpiar')?.addEventListener('click', () => {
      this.limpiarPedido();
    });

    document.getElementById('btnCobrar')?.addEventListener('click', () => this.procesarVenta());

    document.getElementById('btnMovimientoCaja')?.addEventListener('click', () => this.mostrarModalMovimientoCaja());

    document.getElementById('btnCerrarCaja')?.addEventListener('click', () => this.mostrarCierreCaja());
    
    document.getElementById('btnCerrarCajaHeader')?.addEventListener('click', () => this.mostrarCierreCaja());

    document.getElementById('buscador')?.addEventListener('input', () => {
      this.renderProductos();
    });

    document.getElementById('btnSeleccionarCliente')?.addEventListener('click', () => {
      this.mostrarSelectorCliente();
    });

    document.getElementById('btnToggleNota')?.addEventListener('click', () => {
      this.notaVisible = !this.notaVisible;
      document.getElementById('notaPanel').style.display = this.notaVisible ? 'block' : 'none';
      document.getElementById('btnToggleNota').classList.toggle('active', this.notaVisible);
    });

    document.getElementById('btnToggleDescuento')?.addEventListener('click', () => {
      this.descuentoVisible = !this.descuentoVisible;
      document.getElementById('descuentoPanel').style.display = this.descuentoVisible ? 'block' : 'none';
      document.getElementById('btnToggleDescuento').classList.toggle('active', this.descuentoVisible);
    });

    this.sincronizarPago();

    document.getElementById('descuentoTipo')?.addEventListener('change', (e) => {
      this.descuento.tipo = e.target.value;
      this.renderOrden();
    });

    document.getElementById('descuentoValor')?.addEventListener('input', (e) => {
      this.descuento.valor = parseFloat(e.target.value) || 0;
      this.renderOrden();
    });

    document.getElementById('notaPedido')?.addEventListener('input', (e) => {
      this.nota = e.target.value;
    });

    document.getElementById('btnAgregarMedio')?.addEventListener('click', () => {
      if (this.mediosPagoSeleccionados.length < this.mediosPago.length) {
        const mediosDisponibles = this.mediosPago.filter(m => 
          !this.mediosPagoSeleccionados.some(mp => mp.medio === m)
        );
        if (mediosDisponibles.length > 0) {
          this.mediosPagoSeleccionados.push({
            medio: mediosDisponibles[0],
            monto: 0
          });
          this.renderMediosPago();
          this.setupMediosPagoEvents();
          this.actualizarPagoInfo();
        }
      }
    });

    this.setupMediosPagoEvents();
  },

  setupMediosPagoEvents() {
    document.querySelectorAll('.medio-pago-select')?.forEach(select => {
      select.addEventListener('change', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.mediosPagoSeleccionados[index].medio = e.target.value;
      });
    });

    document.querySelectorAll('.medio-pago-monto')?.forEach(input => {
      input.addEventListener('input', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.mediosPagoSeleccionados[index].monto = parseFloat(e.target.value) || 0;
        this.actualizarPagoInfo();
      });
    });

    document.querySelectorAll('.btn-remove-medio')?.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.closest('button').dataset.index);
        this.mediosPagoSeleccionados.splice(index, 1);
        this.renderMediosPago();
        this.setupMediosPagoEvents();
        this.actualizarPagoInfo();
      });
    });
  },

  actualizarPagoInfo() {
    const container = document.getElementById('pagoValidation');
    const total = this.getTotal();
    const pagoTotal = this.getPagoTotal();
    const falta = total - pagoTotal;

    if (container) {
      if (pagoTotal < total) {
        container.innerHTML = `<span class="pago-status incomplete">Falta: ${this.formatPrecio(falta)}</span>`;
      } else if (pagoTotal > total) {
        container.innerHTML = `<span class="pago-status excess">Exceso: ${this.formatPrecio(pagoTotal - total)}</span>`;
      } else {
        container.innerHTML = `<span class="pago-status complete"><i class="ti ti-check"></i> Monto exacto</span>`;
      }
    }
  },

  limpiarPedido() {
    this.carrito = [];
    this.notaVisible = false;
    this.descuentoVisible = false;
    this.descuento = { tipo: 'monto', valor: 0 };
    this.nota = '';
    this.mediosPagoSeleccionados = [{ medio: this.mediosPago[0] || 'Efectivo', monto: 0 }];
    
    ClientesService.getAll().then(clientes => {
      const cf = clientes.find(c => c.nombreCliente === 'Consumidor Final');
      this.clienteActual = cf || null;
      this.render();
      this.setupEvents();
    });
  },

  async agregarProducto(codigo) {
    const articulo = this.articulos.find(a => a.codigo === codigo);
    if (!articulo) return;

    if (articulo.stock <= 0) {
      Modal.alert('Producto sin stock', 'error');
      return;
    }

    const existente = this.carrito.find(p => p.codigo === codigo);
    if (existente) {
      if (existente.cantidad >= articulo.stock) {
        Modal.alert('Stock insuficiente', 'error');
        return;
      }
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

  mostrarSelectorCliente() {
    const content = `
      <div style="margin-bottom: 16px;">
        <input type="text" id="clienteBusqueda" placeholder="Buscar cliente..." autofocus 
          style="width: 100%; padding: 10px 14px; border: var(--apple-border); border-radius: var(--apple-radius); background: var(--apple-gray); font-size: 13px;">
      </div>
      <div id="clienteResults" style="max-height: 200px; overflow-y: auto;">
        <div class="empty-state">Escribí para buscar</div>
      </div>
    `;

    const buttons = [
      { id: 'btnNuevoClienteQuick', text: '+ Nuevo Cliente', type: 'primary' },
      { id: 'btnCancelarCliente', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: 'Seleccionar Cliente',
      content,
      buttons
    });

    document.getElementById('clienteBusqueda')?.addEventListener('input', async (e) => {
      await this.buscarCliente(e.target.value);
    });

    document.getElementById('btnNuevoClienteQuick')?.addEventListener('click', () => {
      this.mostrarFormularioNuevoCliente(modal);
    });

    document.getElementById('btnCancelarCliente')?.addEventListener('click', () => {
      Modal.close(modal);
    });
  },

  async buscarCliente(texto) {
    const container = document.getElementById('clienteResults');
    if (!container) return;

    if (!texto || texto.length < 1) {
      container.innerHTML = '<div class="empty-state">Escribí para buscar</div>';
      return;
    }

    const resultados = await ClientesService.search(texto);
    
    if (resultados.length === 0) {
      container.innerHTML = '<div class="empty-state">No se encontraron clientes</div>';
      return;
    }

    container.innerHTML = resultados.slice(0, 5).map(c => `
      <div class="cliente-result-item" data-id="${c.id}" style="padding: 10px 12px; cursor: pointer; border-radius: var(--apple-radius); margin-bottom: 4px;">
        <div style="font-weight: 500;">${c.nombreCliente}</div>
        <div style="font-size: 12px; color: var(--apple-text-secondary);">${c.telefono || ''}</div>
      </div>
    `).join('');

    container.querySelectorAll('.cliente-result-item').forEach(item => {
      item.addEventListener('click', async () => {
        const cliente = await ClientesService.getById(item.dataset.id);
        this.clienteActual = cliente;
        this.render();
        this.setupEvents();
        Modal.close();
        Modal.alert(`Cliente: ${cliente.nombreCliente}`, 'success');
      });
    });
  },

  mostrarFormularioNuevoCliente(modalPadre) {
    Modal.close(modalPadre);

    const content = `
      <form id="clienteForm">
        <div class="input-group">
          <label>Nombre del Cliente</label>
          <input type="text" name="nombreCliente" required>
        </div>
        <div class="input-group">
          <label>Teléfono</label>
          <input type="tel" name="telefono" placeholder="549...">
        </div>
        <div class="input-group">
          <label>Dirección</label>
          <input type="text" name="direccion">
        </div>
      </form>
    `;

    const buttons = [
      { id: 'btnGuardarCliente', text: 'Crear', type: 'primary' },
      { id: 'btnCancelarNuevoCliente', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: 'Nuevo Cliente',
      content,
      buttons
    });

    document.getElementById('btnGuardarCliente')?.addEventListener('click', async () => {
      const form = document.getElementById('clienteForm');
      const data = Object.fromEntries(new FormData(form));
      
      const nuevo = await ClientesService.create(data);
      this.clienteActual = nuevo;
      this.render();
      this.setupEvents();
      Modal.close(modal);
      Modal.alert(`Cliente creado: ${nuevo.nombreCliente}`, 'success');
    });

    document.getElementById('btnCancelarNuevoCliente')?.addEventListener('click', () => {
      Modal.close(modal);
    });
  },

  async procesarVenta() {
    if (this.carrito.length === 0) {
      Modal.alert('El carrito está vacío', 'error');
      return;
    }

    this.sincronizarPago();
    
    const montoTotal = this.getTotal();
    const montoPagado = this.getPagoTotal();

    if (this.mediosPagoSeleccionados.length > 1 && montoPagado < montoTotal) {
      Modal.alert(`Faltan ${this.formatPrecio(montoTotal - montoPagado)} para completar el pago`, 'error');
      return;
    }

    const mediosPagoFormateados = this.mediosPagoSeleccionados.map(mp => ({
      medio: mp.medio,
      monto: mp.monto
    }));

    const venta = {
      clienteId: this.clienteActual?.id || null,
      cliente: this.clienteActual?.nombreCliente || 'Consumidor Final',
      articulos: [...this.carrito],
      items: this.carrito.reduce((sum, item) => sum + item.cantidad, 0),
      montoTotal: montoTotal,
      mediosPago: mediosPagoFormateados,
      nota: this.nota,
      descuento: this.getDescuento(),
      subtotal: this.getSubtotal(),
      tipo: 'mostrador',
      fecha: new Date().toISOString()
    };

    await VentasService.create(venta);
    await CajaService.agregarVenta(venta);

    if (this.clienteActual && this.clienteActual.nombreCliente !== 'Consumidor Final') {
      await ClientesService.registrarCompra(this.clienteActual.id, montoTotal);
    }

    for (const item of this.carrito) {
      await ArticulosService.updateStock(item.id, -item.cantidad);
    }

    this.articulos = await ArticulosService.getAll();

    this.mostrarTicket(venta);
  },

  mostrarTicket(venta) {
    const modal = Modal.show({
      title: 'Ticket de Venta',
      content: this.generarHTMLTicket(venta),
      buttons: [
        { id: 'btnImprimirTicket', text: '🖨 Imprimir', type: 'secondary' },
        { id: 'btnCerrarTicket', text: 'Cerrar', type: 'primary' }
      ]
    });

    document.getElementById('btnCerrarTicket')?.addEventListener('click', () => {
      Modal.close(modal);
      
      this.carrito = [];
      this.notaVisible = false;
      this.descuentoVisible = false;
      this.descuento = { tipo: 'monto', valor: 0 };
      this.nota = '';
      this.mediosPagoSeleccionados = [{ medio: this.mediosPago[0] || 'Efectivo', monto: 0 }];
      
      ClientesService.getAll().then(clientes => {
        const cf = clientes.find(c => c.nombreCliente === 'Consumidor Final');
        this.clienteActual = cf || null;
        this.render();
        this.setupEvents();
      });
    });

    document.getElementById('btnImprimirTicket')?.addEventListener('click', () => {
      const ticketContent = document.getElementById('ticketContent');
      const printWindow = window.open('', '_blank');
      printWindow.document.write(`
        <html>
          <head>
            <title>Ticket - ${venta.idVenta}</title>
            <style>
              body { font-family: 'Courier New', monospace; padding: 20px; max-width: 300px; margin: 0 auto; }
              .ticket print { padding: 10px; }
            </style>
          </head>
          <body>${ticketContent?.innerHTML || ''}</body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    });
  },

  itemsHtml(articulos) {
    if (!articulos || !articulos.length) return '';
    return articulos.map(item => 
      '<div class="ticket-item">' +
        '<span class="ticket-item-name">' + item.nombre + '</span>' +
        '<span class="ticket-item-qty">x' + item.cantidad + '</span>' +
        '<span class="ticket-item-price">' + this.formatPrecio(item.precio * item.cantidad) + '</span>' +
      '</div>'
    ).join('');
  },

  mediosPagoHtml(mediosPago) {
    if (!mediosPago || !mediosPago.length) return '-';
    return mediosPago.map(mp => mp.medio + ': $' + mp.monto.toLocaleString('es-AR')).join(' + ');
  },

  generarHTMLTicket(venta) {
    const datos = (typeof DatosNegocioService !== 'undefined') 
      ? DatosNegocioService.getSync() 
      : { nombre: 'GG Beach House', telefono: '', direccion: '' };
    
    const descuentoHtml = venta.descuento > 0 
      ? '<div class="ticket-summary-row" style="color: var(--error);"><span>Descuento:</span><span>-' + this.formatPrecio(venta.descuento) + '</span></div>' 
      : '';
    
    return '<div id="ticketContent" class="ticket-modal" style="padding: 0; max-width: 320px; margin: 0 auto;">' +
      '<div class="ticket-header">' +
        '<h3>' + datos.nombre + '</h3>' +
        (datos.direccion ? '<p>' + datos.direccion + '</p>' : '') +
        (datos.telefono ? '<p>Tel: ' + datos.telefono + '</p>' : '') +
      '</div>' +
      '<div style="font-size: 11px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #ccc;">' +
        '<p style="margin: 4px 0;"><strong>Fecha:</strong> ' + new Date(venta.fecha).toLocaleString('es-AR') + '</p>' +
        '<p style="margin: 4px 0;"><strong>Cliente:</strong> ' + venta.cliente + '</p>' +
        (venta.nota ? '<p style="margin: 4px 0;"><strong>Nota:</strong> ' + venta.nota + '</p>' : '') +
      '</div>' +
      '<div class="ticket-items">' + this.itemsHtml(venta.articulos || []) + '</div>' +
      '<div class="ticket-summary">' +
        '<div class="ticket-summary-row"><span>Subtotal:</span><span>' + this.formatPrecio(venta.subtotal) + '</span></div>' +
        descuentoHtml +
        '<div class="ticket-summary-row total"><span>TOTAL:</span><span>' + this.formatPrecio(venta.montoTotal || venta.monto) + '</span></div>' +
      '</div>' +
      '<div class="ticket-footer">' +
        '<p><strong>Pago:</strong> ' + this.mediosPagoHtml(venta.mediosPago) + '</p>' +
        '<p style="margin-top: 16px;">¡Gracias por su compra!</p>' +
      '</div>' +
    '</div>';
  },

  formatPrecio(valor) {
    return '$' + valor.toLocaleString('es-AR');
  },

  async mostrarModalMovimientoCaja() {
    const cajaAbierta = await CajaService.estaAbierta();
    if (!cajaAbierta) {
      Modal.alert('La caja no está abierta. Debes abrir la caja primero.', 'error');
      return;
    }

    const medios = await MediosPagoService.getNombres();
    const mediosOptions = medios.map(m => `<option value="${m}">${m}</option>`).join('');

    const content = `
      <div class="movimiento-caja-modal">
        <div class="movimiento-caja-icon">
          <i class="ti ti-cash" style="font-size: 32px;"></i>
        </div>
        <h2 style="text-align: center; margin-bottom: 16px;">Movimiento de Caja</h2>
        
        <form id="movimientoCajaForm">
          <div class="input-group" style="text-align: left;">
            <label>Tipo de Movimiento</label>
            <select id="tipoMovimiento" required style="font-size: 16px; padding: 12px; width: 100%;">
              <option value="">Seleccionar...</option>
              <option value="ingreso">Ingreso de dinero</option>
              <option value="egreso">Egreso de dinero</option>
            </select>
          </div>
          
          <div class="input-group" style="text-align: left; margin-top: 16px;">
            <label>Concepto</label>
            <input type="text" id="conceptoMovimiento" placeholder="Ej: Reposición, Gasto, etc." required style="font-size: 14px; padding: 12px;">
          </div>
          
          <div class="input-group" style="text-align: left; margin-top: 16px;">
            <label>Monto ($)</label>
            <input type="number" id="montoMovimiento" placeholder="0" required min="0.01" step="0.01" style="font-size: 18px; padding: 14px;">
          </div>
          
          <div class="input-group" style="text-align: left; margin-top: 16px;">
            <label>Método de Pago</label>
            <select id="medioMovimiento" required style="font-size: 14px; padding: 12px; width: 100%;">
              ${mediosOptions}
            </select>
          </div>
        </form>
        
        <div id="movimientoError" class="text-error" style="margin-top: 12px; text-align: center; display: none;"></div>
      </div>
    `;

    const buttons = [
      { id: 'btnGuardarMovimiento', text: 'Guardar', type: 'primary' },
      { id: 'btnCancelarMovimiento', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: 'Movimiento de Caja',
      content,
      buttons
    });

    document.getElementById('btnGuardarMovimiento')?.addEventListener('click', async () => {
      const errorEl = document.getElementById('movimientoError');
      const tipo = document.getElementById('tipoMovimiento')?.value;
      const concepto = document.getElementById('conceptoMovimiento')?.value.trim();
      const monto = parseFloat(document.getElementById('montoMovimiento')?.value);
      const medio = document.getElementById('medioMovimiento')?.value;

      if (!tipo) {
        errorEl.textContent = 'Debes seleccionar el tipo de movimiento';
        errorEl.style.display = 'block';
        return;
      }

      if (!concepto) {
        errorEl.textContent = 'Debes ingresar un concepto';
        errorEl.style.display = 'block';
        return;
      }

      if (!monto || monto <= 0) {
        errorEl.textContent = 'El monto debe ser mayor a 0';
        errorEl.style.display = 'block';
        return;
      }

      try {
        await CajaService.agregarMovimiento(tipo, concepto, monto, medio);

        const movimientoVenta = {
          clienteId: null,
          cliente: 'Sistema - Movimiento de Caja',
          articulos: [],
          items: 0,
          mediosPago: [{ medio: medio, monto: monto }],
          descuento: 0,
          subtotal: monto,
          nota: concepto,
          tipo: 'movimiento_caja',
          monto: monto,
          montoTotal: monto,
          fecha: new Date().toISOString(),
          usuario: AuthService?.getUser()?.email || 'sistema',
          movimientoTipo: tipo,
          movimientoConcepto: concepto
        };
        await VentasService.create(movimientoVenta);

        Modal.close(modal);

        const tipoLabel = tipo === 'ingreso' ? 'Ingreso' : 'Egreso';
        Modal.alert(`${tipoLabel} registrado: $${monto.toLocaleString('es-AR')} - ${concepto}`, 'success');
      } catch (e) {
        errorEl.textContent = 'Error al registrar el movimiento: ' + e.message;
        errorEl.style.display = 'block';
      }
    });

    document.getElementById('btnCancelarMovimiento')?.addEventListener('click', () => {
      Modal.close(modal);
    });

    setTimeout(() => document.getElementById('tipoMovimiento')?.focus(), 100);
  },

  async mostrarCierreCaja() {
    const cajaAbierta = await CajaService.estaAbierta();
    if (!cajaAbierta) {
      Modal.alert('La caja no está abierta', 'error');
      return;
    }

    const resumen = await CajaService.getResumen();
    const content = `
      <div class="cierre-caja-content">
        <div class="cierre-resumen-row">
          <span>Saldo Inicial</span>
          <span>${this.formatPrecio(resumen.saldoInicial)}</span>
        </div>
        ${resumen.movimientosIngresos > 0 || resumen.movimientosEgresos > 0 ? `
        <div class="cierre-resumen-section">
          <div class="cierre-section-title">Movimientos de Caja</div>
          <div class="cierre-resumen-row">
            <span>Ingresos</span>
            <span class="text-success">+${this.formatPrecio(resumen.movimientosIngresos)}</span>
          </div>
          <div class="cierre-resumen-row">
            <span>Egresos</span>
            <span class="text-error">-${this.formatPrecio(resumen.movimientosEgresos)}</span>
          </div>
        </div>
        ` : ''}
        <div class="cierre-resumen-section">
          <div class="cierre-section-title">Ventas por Método</div>
          <div class="cierre-resumen-row">
            <span>Efectivo</span>
            <span>${this.formatPrecio(resumen.ventasEfectivo)}</span>
          </div>
          <div class="cierre-resumen-row">
            <span>Transferencia</span>
            <span>${this.formatPrecio(resumen.ventasTransferencia)}</span>
          </div>
          <div class="cierre-resumen-row">
            <span>Débito</span>
            <span>${this.formatPrecio(resumen.ventasDebito)}</span>
          </div>
          <div class="cierre-resumen-row">
            <span>Crédito</span>
            <span>${this.formatPrecio(resumen.ventasCredito)}</span>
          </div>
        </div>
        <div class="cierre-resumen-row total">
          <span>Total Ventas</span>
          <span>${this.formatPrecio(resumen.totalVentas)}</span>
        </div>
        <div class="cierre-resumen-row">
          <span>Saldo Teórico (efectivo)</span>
          <span>${this.formatPrecio(resumen.saldoTeorico)}</span>
        </div>
        <div class="cierre-input-group">
          <label>Monto_real_contado</label>
          <input type="number" id="montoRealCierre" placeholder="Ingresá el monto en efectivo" autofocus>
        </div>
        <div class="cierre-diferencia" id="cierreDiferencia"></div>
      </div>
    `;

const buttons = [
      { id: 'btnConfirmarCierre', text: 'Cerrar Caja', type: 'primary' },
      { id: 'btnWhatsAppCierre', text: 'Enviar por WhatsApp', type: 'secondary' },
      { id: 'btnCancelarCierre', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: 'Cerrar Caja',
      content,
      buttons
    });

    document.getElementById('montoRealCierre')?.addEventListener('input', (e) => {
      const montoReal = parseFloat(e.target.value) || 0;
      const diferencia = montoReal - resumen.saldoTeorico;
      const diffEl = document.getElementById('cierreDiferencia');
      if (diffEl) {
        if (diferencia === 0) {
          diffEl.innerHTML = '<span class="diff-exact"><i class="ti ti-check"></i> Cuadre exacto</span>';
        } else if (diferencia > 0) {
          diffEl.innerHTML = '<span class="diff-excess">Sobra: ' + this.formatPrecio(diferencia) + '</span>';
        } else {
          diffEl.innerHTML = '<span class="diff-lack">Falta: ' + this.formatPrecio(Math.abs(diferencia)) + '</span>';
        }
      }
    });

    document.getElementById('btnConfirmarCierre')?.addEventListener('click', async () => {
      const montoReal = parseFloat(document.getElementById('montoRealCierre').value) || 0;
      await CajaService.cerrar(montoReal);
      Modal.close(modal);
      Modal.alert('Caja cerrada correctamente', 'success');
    });

    document.getElementById('btnWhatsAppCierre')?.addEventListener('click', async () => {
      await this.enviarCierrePorWhatsApp(resumen);
    });

    document.getElementById('btnCancelarCierre')?.addEventListener('click', () => {
      Modal.close(modal);
    });
  },

  async enviarCierrePorWhatsApp(resumen) {
    const datos = await DatosNegocioService.get();
    const numero = datos.whatsapp || '';
    
    if (!numero) {
      Modal.alert('No hay número de WhatsApp configurado en Datos del Negocio', 'error');
      return;
    }

    const hoy = new Date().toLocaleDateString('es-AR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    const mensaje = '*CIERRE DE CAJA - ' + datos.nombre.toUpperCase() + '*' + '\n' +
      'Fecha: ' + hoy + '\n\n' +
      '_Apertura_:' + '\n' +
      '• Saldo Inicial: ' + this.formatPrecio(resumen.saldoInicial) + '\n\n' +
      '_Movimientos de Caja_:' + '\n' +
      '• Ingresos: ' + this.formatPrecio(resumen.movimientosIngresos) + '\n' +
      '• Egresos: ' + this.formatPrecio(resumen.movimientosEgresos) + '\n\n' +
      '_Ventas por Método_:' + '\n' +
      '• Efectivo: ' + this.formatPrecio(resumen.ventasEfectivo) + '\n' +
      '• Transferencia: ' + this.formatPrecio(resumen.ventasTransferencia) + '\n' +
      '• Débito: ' + this.formatPrecio(resumen.ventasDebito) + '\n' +
      '• Crédito: ' + this.formatPrecio(resumen.ventasCredito) + '\n\n' +
      '_Totales_:' + '\n' +
      '• Total Ventas: ' + this.formatPrecio(resumen.totalVentas) + '\n' +
      '• Saldo Teórico: ' + this.formatPrecio(resumen.saldoTeorico) + '\n' +
      '• Cant. Ventas: ' + resumen.cantidadVentas;

    const urlWhatsApp = 'https://wa.me/' + numero + '?text=' + encodeURIComponent(mensaje);
    
    window.open(urlWhatsApp, '_blank');
  }
};

window.POSPage = POSPage;