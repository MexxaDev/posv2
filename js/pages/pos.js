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
            <span class="order-panel-count" id="ordenCount">0 items</span>
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
      });
    });
  },

  actualizarPagoInfo() {
    const pagoTotalEl = document.getElementById('pagoTotal');
    const vueltoRow = document.getElementById('vueltoRow');
    const vuelveMonto = document.getElementById('vueltoMonto');

    if (pagoTotalEl) {
      pagoTotalEl.textContent = this.formatPrecio(this.getPagoTotal());
      pagoTotalEl.className = this.getPagoTotal() >= this.getTotal() ? 'text-success' : '';
    }
    if (vueltoRow) vuelveMonto.style.display = this.getVuelto() > 0 ? 'flex' : 'none';
    if (vuelveMonto) vueltaMonto.textContent = this.formatPrecio(this.getVuelto());
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
      monto: montoTotal,
      medioPago: mediosPagoFormateados[0].medio,
      mediosPago: mediosPagoFormateados,
      items: [...this.carrito],
      nota: this.nota,
      descuento: this.getDescuento(),
      subtotal: this.getSubtotal(),
      tipo: 'mostrador',
      fecha: new Date().toISOString()
    };

    await VentasService.create(venta);
    await CajaService.agregarVenta({
      ...venta,
      medioPago: venta.medioPago
    });

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
  },

  generarHTMLTicket(venta) {
    const datos = DatosNegocioService.getSync ? DatosNegocioService.getSync() : { nombre: 'GG Beach House', telefono: '', direccion: '' };
    
    return `
      <div style="padding: 20px; font-family: var(--font-family);">
        <div style="text-align: center; margin-bottom: 20px;">
          <h3 style="margin: 0 0 8px 0;">${datos.nombre}</h3>
          ${datos.direccion ? `<p style="font-size: 12px; color: var(--apple-text-secondary);">${datos.direccion}</p>` : ''}
          ${datos.telefono ? `<p style="font-size: 12px; color: var(--apple-text-secondary);">Tel: ${datos.telefono}</p>` : ''}
        </div>
        <div style="font-size: 12px; margin-bottom: 16px;">
          <p><strong>Fecha:</strong> ${new Date(venta.fecha).toLocaleString('es-AR')}</p>
          <p><strong>Cliente:</strong> ${venta.cliente}</p>
          ${venta.nota ? `<p><strong>Nota:</strong> ${venta.nota}</p>` : ''}
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
          <thead>
            <tr style="border-bottom: 1px solid var(--apple-border);">
              <th style="text-align: left; padding: 8px 0;">Producto</th>
              <th style="text-align: center; padding: 8px 0;">Cant</th>
              <th style="text-align: right; padding: 8px 0;">Total</th>
            </tr>
          </thead>
          <tbody>
            ${venta.items.map(item => `
              <tr>
                <td style="padding: 6px 0;">${item.nombre}</td>
                <td style="text-align: center; padding: 6px 0;">${item.cantidad}</td>
                <td style="text-align: right; padding: 6px 0;">${this.formatPrecio(item.precio * item.cantidad)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="border-top: 1px solid var(--apple-border); padding-top: 12px;">
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
            <span>Subtotal:</span>
            <span>${this.formatPrecio(venta.subtotal)}</span>
          </div>
          ${venta.descuento > 0 ? `
          <div style="display: flex; justify-content: space-between; margin-bottom: 4px; color: var(--error);">
            <span>Descuento:</span>
            <span>-${this.formatPrecio(venta.descuento)}</span>
          </div>
          ` : ''}
          <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 18px;">
            <span>TOTAL:</span>
            <span>${this.formatPrecio(venta.monto)}</span>
          </div>
        </div>
        <div style="margin-top: 16px; font-size: 12px; color: var(--apple-text-secondary); text-align: center;">
          <p><strong>Pago:</strong> ${venta.mediosPago.map(mp => `${mp.medio}: $${mp.monto.toLocaleString('es-AR')}`).join(', ')}</p>
        </div>
        <div style="margin-top: 20px; text-align: center; font-size: 14px;">
          <p>¡Gracias por su compra! 🎉</p>
        </div>
      </div>
    `;
  },

  formatPrecio(valor) {
    return '$' + valor.toLocaleString('es-AR');
  }
};

window.POSPage = POSPage;