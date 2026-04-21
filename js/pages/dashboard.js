const DashboardPage = {
  activeTab: 'metricas',

  async init() {
    if (!Router.requireAuth(null, 'admin')) return;
    this.render();
    await this.loadData();
    this.setupEvents();
  },

  async render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="dashboard-page">
        <div class="tabs">
          <button class="tab active" data-tab="metricas">Métricas</button>
          <button class="tab" data-tab="articulos">Artículos</button>
          <button class="tab" data-tab="clientes">Clientes</button>
          <button class="tab" data-tab="medios">Medios de Pago</button>
          <button class="tab" data-tab="ventas">Ventas</button>
          <button class="tab" data-tab="negocio">Negocio</button>
        </div>

        <div id="tabContent"></div>
      </div>
    `;
  },

  async loadData() {
    await this.renderMetricas();
  },

  async renderMetricas() {
    const content = document.getElementById('tabContent');

    const totalVentas = await VentasService.getTotalVentas();
    const ingresosDia = await VentasService.getIngresosDelDia();
    const productosStock = await ArticulosService.getTotalStock();
    const clientesCount = await ClientesService.getCount();
    const ventasUltimosDias = await VentasService.getVentasUltimosDias(7);
    const mediosPago = await VentasService.getEstadisticasMediosPago();

    content.innerHTML = `
      <div class="dashboard-header">
        <h2 class="page-title">Dashboard</h2>
        <p class="text-muted">Resumen de tu negocio</p>
      </div>

      <div class="metrics-grid">
        <div class="metric-card metric-sales">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 3h18v18H3z"></path>
              <path d="M3 9h18"></path>
              <path d="M9 21V9"></path>
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-value">${totalVentas}</span>
            <span class="metric-label">Total Ventas</span>
          </div>
        </div>

        <div class="metric-card metric-income">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="1" x2="12" y2="23"></line>
              <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-value">$${ingresosDia.toLocaleString('es-AR')}</span>
            <span class="metric-label">Ingresos del Día</span>
          </div>
        </div>

        <div class="metric-card metric-products">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-value">${productosStock}</span>
            <span class="metric-label">Productos en Stock</span>
          </div>
        </div>

        <div class="metric-card metric-clients">
          <div class="metric-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
          </div>
          <div class="metric-info">
            <span class="metric-value">${clientesCount}</span>
            <span class="metric-label">Clientes</span>
          </div>
        </div>
      </div>

      <div class="charts-grid">
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Ventas últimos 7 días</h3>
          </div>
          <canvas id="chartVentas" height="200"></canvas>
        </div>
        <div class="card">
          <div class="card-header">
            <h3 class="card-title">Medios de Pago</h3>
          </div>
          <canvas id="chartMedios" height="200"></canvas>
        </div>
      </div>

      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Actividad Reciente</h3>
        </div>
        <div id="actividadReciente"></div>
      </div>
    `;

    this.renderChartVentas(ventasUltimosDias);
    this.renderChartMedios(mediosPago);
    await this.renderActividadReciente();
  },

  renderChartVentas(data) {
    const ctx = document.getElementById('chartVentas');
    if (!ctx) return;

    new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => {
          const fecha = new Date(d.fecha);
          return fecha.toLocaleDateString('es-AR', { weekday: 'short' });
        }),
        datasets: [{
          label: 'Ventas',
          data: data.map(d => d.monto),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false }
        },
        scales: {
          y: { beginAtZero: true }
        }
      }
    });
  },

  renderChartMedios(data) {
    const ctx = document.getElementById('chartMedios');
    if (!ctx) return;

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444'];

    new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{
          data: values,
          backgroundColor: colors.slice(0, labels.length)
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { position: 'bottom' }
        }
      }
    });
  },

  async renderActividadReciente() {
    const container = document.getElementById('actividadReciente');
    const ventas = await VentasService.getAll();
    const recientes = ventas.slice(-10).reverse();

    if (recientes.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>No hay ventas registradas</p></div>';
      return;
    }

    container.innerHTML = `
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Cliente</th>
            <th>Monto</th>
            <th>Método</th>
          </tr>
        </thead>
        <tbody>
          ${recientes.map(v => `
            <tr>
              <td>${new Date(v.fecha).toLocaleString('es-AR')}</td>
              <td>${v.cliente}</td>
              <td>$${v.monto.toLocaleString('es-AR')}</td>
              <td>${v.medioPago}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  async renderArticulos() {
    const content = document.getElementById('tabContent');
    const articulos = await ArticulosService.getAll();

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Gestión de Artículos</h3>
          <button class="btn btn-primary" id="btnNuevoArticulo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo Artículo
          </button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Nombre</th>
                <th>Categoría</th>
                <th>Precio</th>
                <th>Stock</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="articulosTable"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderArticulosTable(articulos);
    this.setupArticulosEvents();
  },

  renderArticulosTable(articulos) {
    const tbody = document.getElementById('articulosTable');
    tbody.innerHTML = articulos.map(a => `
      <tr>
        <td>${a.codigo}</td>
        <td>${a.nombre}</td>
        <td><span class="badge badge-success">${a.categoria}</span></td>
        <td>$${a.precio.toLocaleString('es-AR')}</td>
        <td>${a.stock}</td>
        <td>
          <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${a.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${a.id}">Eliminar</button>
        </td>
      </tr>
    `).join('');
  },

  setupArticulosEvents() {
    document.getElementById('btnNuevoArticulo')?.addEventListener('click', () => this.mostrarFormularioArticulo());

    document.getElementById('articulosTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'edit') {
        const articulo = await ArticulosService.getById(id);
        this.mostrarFormularioArticulo(articulo);
      } else if (action === 'delete') {
        const confirm = await Modal.confirm('¿Estás seguro de eliminar este artículo?');
        if (confirm) {
          await ArticulosService.delete(id);
          Modal.alert('Artículo eliminado', 'success');
          this.renderArticulos();
        }
      }
    });
  },

  async mostrarFormularioArticulo(articulo = null) {
    const content = `
      <form id="articuloForm">
        <div class="form-row">
          <div class="input-group">
            <label>Código</label>
            <input type="text" name="codigo" value="${articulo?.codigo || ''}" required>
          </div>
          <div class="input-group">
            <label>Nombre</label>
            <input type="text" name="nombre" value="${articulo?.nombre || ''}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="input-group">
            <label>Categoría</label>
            <input type="text" name="categoria" value="${articulo?.categoria || ''}" placeholder="bebidas, promos, etc.">
          </div>
          <div class="input-group">
            <label>Precio</label>
            <input type="number" name="precio" value="${articulo?.precio || ''}" required>
          </div>
        </div>
        <div class="input-group">
          <label>Stock</label>
          <input type="number" name="stock" value="${articulo?.stock || 0}">
        </div>
      </form>
    `;

    const buttons = [
      { id: 'btnGuardar', text: articulo ? 'Actualizar' : 'Crear', type: 'primary' },
      { id: 'btnCancelar', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: articulo ? 'Editar Artículo' : 'Nuevo Artículo',
      content,
      buttons
    });

    document.getElementById('btnGuardar')?.addEventListener('click', async () => {
      const form = document.getElementById('articuloForm');
      const formData = new FormData(form);
      const data = Object.fromEntries(formData);

      if (articulo) {
        await ArticulosService.update(articulo.id, data);
        Modal.alert('Artículo actualizado', 'success');
      } else {
        await ArticulosService.create(data);
        Modal.alert('Artículo creado', 'success');
      }

      Modal.close(modal);
      this.renderArticulos();
    });

    document.getElementById('btnCancelar')?.addEventListener('click', () => Modal.close(modal));
  },

  async renderClientes() {
    const content = document.getElementById('tabContent');
    const clientes = await ClientesService.getAll();

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Gestión de Clientes</h3>
          <button class="btn btn-primary" id="btnNuevoCliente">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo Cliente
          </button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="clientesTable"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderClientesTable(clientes);
    this.setupClientesEvents();
  },

  renderClientesTable(clientes) {
    const tbody = document.getElementById('clientesTable');
    tbody.innerHTML = clientes.map(c => `
      <tr>
        <td>${c.nombreCliente}</td>
        <td>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${c.id}">Eliminar</button>
        </td>
      </tr>
    `).join('');
  },

  setupClientesEvents() {
    document.getElementById('btnNuevoCliente')?.addEventListener('click', () => this.mostrarFormularioCliente());

    document.getElementById('clientesTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.dataset.action !== 'delete') return;

      const confirm = await Modal.confirm('¿Eliminar este cliente?');
      if (confirm) {
        await ClientesService.delete(btn.dataset.id);
        Modal.alert('Cliente eliminado', 'success');
        this.renderClientes();
      }
    });
  },

  mostrarFormularioCliente(cliente = null) {
    const content = `
      <form id="clienteForm">
        <div class="input-group">
          <label>Nombre del Cliente</label>
          <input type="text" name="nombreCliente" value="${cliente?.nombreCliente || ''}" required>
        </div>
      </form>
    `;

    const buttons = [
      { id: 'btnGuardar', text: 'Guardar', type: 'primary' },
      { id: 'btnCancelar', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: cliente ? 'Editar Cliente' : 'Nuevo Cliente',
      content,
      buttons
    });

    document.getElementById('btnGuardar')?.addEventListener('click', async () => {
      const form = document.getElementById('clienteForm');
      const data = Object.fromEntries(new FormData(form));

      if (cliente) {
        await ClientesService.update(cliente.id, data);
        Modal.alert('Cliente actualizado', 'success');
      } else {
        await ClientesService.create(data);
        Modal.alert('Cliente creado', 'success');
      }

      Modal.close(modal);
      this.renderClientes();
    });

    document.getElementById('btnCancelar')?.addEventListener('click', () => Modal.close(modal));
  },

  async renderMediosPago() {
    const content = document.getElementById('tabContent');
    const medios = await MediosPagoService.getAll();

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Medios de Pago</h3>
          <button class="btn btn-primary" id="btnNuevoMedio">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo Método
          </button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody id="mediosTable"></tbody>
          </table>
        </div>
      </div>
    `;

    this.renderMediosTable(medios);
    this.setupMediosEvents();
  },

  renderMediosTable(medios) {
    const tbody = document.getElementById('mediosTable');
    tbody.innerHTML = medios.map(m => `
      <tr>
        <td>${m.nombre}</td>
        <td>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${m.id}">Eliminar</button>
        </td>
      </tr>
    `).join('');
  },

  setupMediosEvents() {
    document.getElementById('btnNuevoMedio')?.addEventListener('click', () => this.mostrarFormularioMedio());

    document.getElementById('mediosTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.dataset.action !== 'delete') return;

      const confirm = await Modal.confirm('¿Eliminar este método de pago?');
      if (confirm) {
        await MediosPagoService.delete(btn.dataset.id);
        Modal.alert('Método eliminado', 'success');
        this.renderMediosPago();
      }
    });
  },

  mostrarFormularioMedio(medio = null) {
    const content = `
      <form id="medioForm">
        <div class="input-group">
          <label>Nombre del Método de Pago</label>
          <input type="text" name="nombre" value="${medio?.nombre || ''}" required>
        </div>
      </form>
    `;

    const buttons = [
      { id: 'btnGuardar', text: 'Guardar', type: 'primary' },
      { id: 'btnCancelar', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: medio ? 'Editar Método' : 'Nuevo Método de Pago',
      content,
      buttons
    });

    document.getElementById('btnGuardar')?.addEventListener('click', async () => {
      const form = document.getElementById('medioForm');
      const data = Object.fromEntries(new FormData(form));

      if (medio) {
        await MediosPagoService.update(medio.id, data);
        Modal.alert('Método actualizado', 'success');
      } else {
        await MediosPagoService.create(data);
        Modal.alert('Método creado', 'success');
      }

      Modal.close(modal);
      this.renderMediosPago();
    });

    document.getElementById('btnCancelar')?.addEventListener('click', () => Modal.close(modal));
  },

  async renderVentas() {
    const content = document.getElementById('tabContent');
    const ventas = (await VentasService.getAll()).reverse();

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Historial de Ventas</h3>
          <button class="btn btn-secondary" id="btnExportarVentas">Exportar CSV</button>
        </div>
        <div class="table-container">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Monto</th>
                <th>Método</th>
              </tr>
            </thead>
            <tbody id="ventasTable"></tbody>
          </table>
        </div>
      </div>
    `;

    const tbody = document.getElementById('ventasTable');
    tbody.innerHTML = ventas.length === 0
      ? '<tr><td colspan="5" class="text-center">No hay ventas</td></tr>'
      : ventas.map(v => `
        <tr>
          <td>${v.idVenta.substring(0, 12)}...</td>
          <td>${new Date(v.fecha).toLocaleString('es-AR')}</td>
          <td>${v.cliente}</td>
          <td>$${v.monto.toLocaleString('es-AR')}</td>
          <td>${v.medioPago}</td>
        </tr>
      `).join('');

    document.getElementById('btnExportarVentas')?.addEventListener('click', () => VentasService.descargarCSV());
  },

  async renderNegocio() {
    const content = document.getElementById('tabContent');
    const datos = await DatosNegocioService.get();

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <h3 class="card-title">Datos del Negocio</h3>
        </div>
        <form id="negocioForm">
          <div class="form-row">
            <div class="input-group">
              <label>Nombre</label>
              <input type="text" name="nombre" value="${datos.nombre}">
            </div>
            <div class="input-group">
              <label>Teléfono</label>
              <input type="text" name="telefono" value="${datos.telefono || ''}">
            </div>
          </div>
          <div class="input-group">
            <label>Dirección</label>
            <input type="text" name="direccion" value="${datos.direccion || ''}">
          </div>
          <button type="submit" class="btn btn-primary">Guardar Cambios</button>
        </form>
      </div>
    `;

    document.getElementById('negocioForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      await DatosNegocioService.update(data);
      Modal.alert('Datos actualizados', 'success');
    });
  },

  setupEvents() {
    document.querySelector('.tabs')?.addEventListener('click', async (e) => {
      const tab = e.target.closest('.tab');
      if (!tab) return;

      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.dataset.tab;

      switch (tabName) {
        case 'metricas':
          await this.renderMetricas();
          break;
        case 'articulos':
          await this.renderArticulos();
          break;
        case 'clientes':
          await this.renderClientes();
          break;
        case 'medios':
          await this.renderMediosPago();
          break;
        case 'ventas':
          await this.renderVentas();
          break;
        case 'negocio':
          await this.renderNegocio();
          break;
      }
    });
  }
};

window.DashboardPage = DashboardPage;
