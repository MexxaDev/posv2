const DashboardPage = {
  activeTab: 'metricas',
  filtros: {},
  charts: {},

  async init() {
    if (!Router.requireAuth(null, 'admin')) return;
    
    const hoy = new Date().toISOString().split('T')[0];
    this.filtros = {
      fechaInicio: hoy,
      fechaFin: hoy,
      periodo: 'hoy'
    };
    
    this.render();
    await this.loadData();
    this.setupEvents();
  },

  async render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="dashboard-apple">
        <div class="dashboard-header-apple">
          <h1 class="dashboard-title-apple">Dashboard</h1>
          <p class="dashboard-subtitle-apple">Resumen de tu negocio</p>
        </div>

        <div class="tabs-apple">
          <button class="tab-apple active" data-tab="metricas">
            <i class="ti ti-chart-bar"></i>
            Métricas
          </button>
          <button class="tab-apple" data-tab="articulos">
            <i class="ti ti-box"></i>
            Artículos
          </button>
          <button class="tab-apple" data-tab="categorias">
            <i class="ti ti-tag"></i>
            Categorías
          </button>
          <button class="tab-apple" data-tab="clientes">
            <i class="ti ti-users"></i>
            Clientes
          </button>
          <button class="tab-apple" data-tab="medios">
            <i class="ti ti-credit-card"></i>
            Medios de Pago
          </button>
          <button class="tab-apple" data-tab="ventas">
            <i class="ti ti-receipt"></i>
            Ventas
          </button>
          <button class="tab-apple" data-tab="negocio">
            <i class="ti ti-settings"></i>
            Negocio
          </button>
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
    const filtros = this.filtros;
    const medios = await MediosPagoService.getNombres();

    content.innerHTML = `
      <div class="filters-apple">
        <div class="filter-group-apple">
          <label>Período</label>
          <select id="filtroPeriodo">
            <option value="hoy" ${filtros.periodo === 'hoy' ? 'selected' : ''}>Hoy</option>
            <option value="ayer" ${filtros.periodo === 'ayer' ? 'selected' : ''}>Ayer</option>
            <option value="semana" ${filtros.periodo === 'semana' ? 'selected' : ''}>Esta semana</option>
            <option value="mes" ${filtros.periodo === 'mes' ? 'selected' : ''}>Este mes</option>
            <option value="personalizado" ${filtros.periodo === 'personalizado' ? 'selected' : ''}>Personalizado</option>
          </select>
        </div>
        <div class="filter-group-apple filter-dates-apple" style="display: ${filtros.periodo === 'personalizado' ? 'flex' : 'none'}">
          <input type="date" id="filtroFechaInicio" value="${filtros.fechaInicio}">
          <span>hasta</span>
          <input type="date" id="filtroFechaFin" value="${filtros.fechaFin}">
        </div>
        <div class="filter-group-apple">
          <label>Método</label>
          <select id="filtroMedio">
            <option value="">Todos</option>
            ${medios.map(m => `<option value="${m}" ${filtros.medioPago === m ? 'selected' : ''}>${m}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group-apple">
          <label>Cliente</label>
          <input type="text" id="filtroCliente" placeholder="Buscar..." value="${filtros.cliente || ''}">
        </div>
        <div class="filter-actions-apple">
          <button class="apple-btn apple-btn-primary" id="btnAplicarFiltros">
            <i class="ti ti-check"></i>
            Aplicar
          </button>
          <button class="apple-btn apple-btn-secondary" id="btnLimpiarFiltros">
            <i class="ti ti-x"></i>
            Limpiar
          </button>
        </div>
      </div>

      <div class="metrics-grid-apple">
        <div class="metric-card-apple">
          <div class="metric-icon-apple">
            <i class="ti ti-shopping-cart"></i>
          </div>
          <div class="metric-info-apple">
            <span class="metric-value-apple" id="metricVentas">0</span>
            <span class="metric-label-apple">Ventas</span>
          </div>
        </div>

        <div class="metric-card-apple">
          <div class="metric-icon-apple">
            <i class="ti ti-cash"></i>
          </div>
          <div class="metric-info-apple">
            <span class="metric-value-apple" id="metricIngresos">$0</span>
            <span class="metric-label-apple">Ingresos</span>
          </div>
        </div>

        <div class="metric-card-apple">
          <div class="metric-icon-apple">
            <i class="ti ti-receipt"></i>
          </div>
          <div class="metric-info-apple">
            <span class="metric-value-apple" id="metricTicketProm">$0</span>
            <span class="metric-label-apple">Ticket Prom.</span>
          </div>
        </div>

        <div class="metric-card-apple">
          <div class="metric-icon-apple">
            <i class="ti ti-packages"></i>
          </div>
          <div class="metric-info-apple">
            <span class="metric-value-apple" id="metricItemsProm">0</span>
            <span class="metric-label-apple">Items/Venta</span>
          </div>
        </div>

        <div class="metric-card-apple">
          <div class="metric-icon-apple">
            <i class="ti ti-box"></i>
          </div>
          <div class="metric-info-apple">
            <span class="metric-value-apple" id="metricStock">0</span>
            <span class="metric-label-apple">Stock Total</span>
          </div>
        </div>

        <div class="metric-card-apple">
          <div class="metric-icon-apple">
            <i class="ti ti-user"></i>
          </div>
          <div class="metric-info-apple">
            <span class="metric-value-apple" id="metricClientes">0</span>
            <span class="metric-label-apple">Clientes</span>
          </div>
        </div>
      </div>

      <div class="charts-grid-apple">
        <div class="chart-card-apple">
          <div class="chart-title-apple">Top 10 Productos</div>
          <canvas id="chartTopProductos" height="120"></canvas>
        </div>
        <div class="chart-card-apple">
          <div class="chart-title-apple">Ventas por Hora</div>
          <canvas id="chartPorHora" height="120"></canvas>
        </div>
        <div class="chart-card-apple">
          <div class="chart-title-apple">Medios de Pago</div>
          <canvas id="chartMedios" height="120"></canvas>
        </div>
        <div class="chart-card-apple">
          <div class="chart-title-apple">Últimos 7 días</div>
          <canvas id="chartVentas" height="120"></canvas>
        </div>
      </div>

      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-user"></i>
            Top 10 Clientes
          </h3>
        </div>
        <div class="apple-card-body">
          <div id="topClientesTable"></div>
        </div>
      </div>

      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-activity"></i>
            Actividad Reciente
          </h3>
          <div class="header-actions-apple">
            <button class="apple-btn apple-btn-secondary" id="btnExportarPDF">
              <i class="ti ti-file"></i>
              PDF
            </button>
            <button class="apple-btn apple-btn-secondary" id="btnExportarCSV">
              <i class="ti ti-file-spreadsheet"></i>
              CSV
            </button>
          </div>
        </div>
        <div class="apple-card-body">
          <div id="actividadReciente"></div>
        </div>
      </div>
    `;

    await this.cargarMetricas(filtros);
    this.setupFiltrosEvents();
  },

  async cargarMetricas(filtros) {
    const [ventas, ticketProm, itemsProm, topProductos, topClientes, ventasPorHora] = await Promise.all([
      VentasService.getCantidadVentas(filtros),
      VentasService.getTicketPromedio(filtros),
      VentasService.getItemsPromedio(filtros),
      VentasService.getTopProductos(10, filtros),
      VentasService.getTopClientes(10, filtros),
      VentasService.getVentasPorHora(filtros)
    ]);

    const ingresos = await VentasService.getIngresosPorRango(filtros);
    const productosStock = await ArticulosService.getTotalStock();
    const clientesCount = await ClientesService.getCount();
    const ventasUltimosDias = await VentasService.getVentasUltimosDias(7);
    const mediosPago = await VentasService.getEstadisticasMediosPago();

    document.getElementById('metricVentas').textContent = ventas;
    document.getElementById('metricIngresos').textContent = '$' + ingresos.toLocaleString('es-AR');
    document.getElementById('metricTicketProm').textContent = '$' + ticketProm.toLocaleString('es-AR');
    document.getElementById('metricItemsProm').textContent = itemsProm;
    document.getElementById('metricStock').textContent = productosStock;
    document.getElementById('metricClientes').textContent = clientesCount;

    this.renderChartTopProductos(topProductos);
    this.renderChartPorHora(ventasPorHora);
    this.renderChartMedios(mediosPago);
    this.renderChartVentas(ventasUltimosDias);
    this.renderTopClientesTable(topClientes);
    await this.renderActividadReciente(filtros);
  },

  renderChartTopProductos(data) {
    const ctx = document.getElementById('chartTopProductos');
    if (!ctx || !data.length) return;
    
    if (this.charts.topProductos) this.charts.topProductos.destroy();

    this.charts.topProductos = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map(d => d.nombre.substring(0, 12)),
        datasets: [{
          label: 'Cantidad',
          data: data.map(d => d.cantidad),
          backgroundColor: '#6366f1',
          borderRadius: 4
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true } }
      }
    });
  },

  renderChartPorHora(data) {
    const ctx = document.getElementById('chartPorHora');
    if (!ctx) return;
    
    if (this.charts.porHora) this.charts.porHora.destroy();

    this.charts.porHora = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: data.map((_, i) => `${i}h`),
        datasets: [{
          label: 'Ingresos',
          data: data.map(d => d.monto),
          backgroundColor: '#10b981',
          borderRadius: 4
        }]
      },
      options: {
        responsive: true,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  },

  renderChartMedios(data) {
    const ctx = document.getElementById('chartMedios');
    if (!ctx) return;
    
    if (this.charts.medios) this.charts.medios.destroy();

    const labels = Object.keys(data);
    const values = Object.values(data);
    const colors = ['#10b981', '#6366f1', '#f59e0b', '#ef4444', '#8b5cf6'];

    this.charts.medios = new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: labels,
        datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length) }]
      },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom', labels: { boxWidth: 10, padding: 6, font: { size: 10 } } } }
      }
    });
  },

  renderChartVentas(data) {
    const ctx = document.getElementById('chartVentas');
    if (!ctx) return;
    
    if (this.charts.ventas) this.charts.ventas.destroy();

    this.charts.ventas = new Chart(ctx, {
      type: 'line',
      data: {
        labels: data.map(d => new Date(d.fecha).toLocaleDateString('es-AR', { weekday: 'short' })),
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
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true } }
      }
    });
  },

  renderTopClientesTable(data) {
    const container = document.getElementById('topClientesTable');
    if (!container) return;
    
    if (!data.length) {
      container.innerHTML = '<div class="empty-state"><p>No hay clientes</p></div>';
      return;
    }

    container.innerHTML = `
      <table class="table-apple">
        <thead><tr><th>#</th><th>Cliente</th><th>Compras</th><th>Total</th></tr></thead>
        <tbody>
          ${data.map((c, i) => `
            <tr>
              <td>${i + 1}</td>
              <td>${c.nombre}</td>
              <td>${c.ventas}</td>
              <td>$${c.monto.toLocaleString('es-AR')}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  async renderActividadReciente(filtros) {
    const container = document.getElementById('actividadReciente');
    const ventas = await VentasService.getVentasFiltradas(filtros);
    const recientes = ventas.slice(-15).reverse();

    if (!recientes.length) {
      container.innerHTML = '<div class="empty-state"><p>No hay ventas registradas</p></div>';
      return;
    }

    container.innerHTML = `
      <table class="table-apple">
        <thead><tr><th>Fecha</th><th>Cliente</th><th>Items</th><th>Monto</th><th>Método</th></tr></thead>
        <tbody>
          ${recientes.map(v => `
            <tr>
              <td>${new Date(v.fecha).toLocaleString('es-AR')}</td>
              <td>${v.cliente}</td>
              <td>${v.items?.length || 0}</td>
              <td>$${v.monto.toLocaleString('es-AR')}</td>
              <td>${v.medioPago}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    `;
  },

  setupFiltrosEvents() {
    document.getElementById('filtroPeriodo')?.addEventListener('change', (e) => {
      const periodo = e.target.value;
      const hoy = new Date().toISOString().split('T')[0];
      
      if (periodo === 'hoy') {
        this.filtros = { fechaInicio: hoy, fechaFin: hoy, periodo: 'hoy' };
      } else if (periodo === 'ayer') {
        const ayer = new Date();
        ayer.setDate(ayer.getDate() - 1);
        const fecha = ayer.toISOString().split('T')[0];
        this.filtros = { fechaInicio: fecha, fechaFin: fecha, periodo: 'ayer' };
      } else if (periodo === 'semana') {
        const inicio = new Date();
        inicio.setDate(inicio.getDate() - inicio.getDay());
        this.filtros = { fechaInicio: inicio.toISOString().split('T')[0], fechaFin: hoy, periodo: 'semana' };
      } else if (periodo === 'mes') {
        const inicio = new Date(hoy.substring(0, 7) + '-01');
        this.filtros = { fechaInicio: inicio.toISOString().split('T')[0], fechaFin: hoy, periodo: 'mes' };
      } else {
        this.filtros.periodo = 'personalizado';
      }
      
      this.renderMetricas();
    });

    document.getElementById('btnAplicarFiltros')?.addEventListener('click', async () => {
      this.filtros.periodo = 'personalizado';
      this.filtros.fechaInicio = document.getElementById('filtroFechaInicio').value;
      this.filtros.fechaFin = document.getElementById('filtroFechaFin').value;
      this.filtros.medioPago = document.getElementById('filtroMedio').value;
      this.filtros.cliente = document.getElementById('filtroCliente').value;
      
      await this.cargarMetricas(this.filtros);
    });

    document.getElementById('btnLimpiarFiltros')?.addEventListener('click', async () => {
      const hoy = new Date().toISOString().split('T')[0];
      this.filtros = { fechaInicio: hoy, fechaFin: hoy, periodo: 'hoy' };
      this.renderMetricas();
    });

    document.getElementById('btnExportarPDF')?.addEventListener('click', async () => {
      await VentasService.generarReportePDF(this.filtros);
    });

    document.getElementById('btnExportarCSV')?.addEventListener('click', async () => {
      await VentasService.descargarCSV(this.filtros);
    });
  },

  async renderArticulos() {
    const content = document.getElementById('tabContent');
    const articulos = await ArticulosService.getAll();

    content.innerHTML = `
      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-box"></i>
            Gestión de Artículos
          </h3>
          <button class="apple-btn apple-btn-primary" id="btnNuevoArticulo">
            <i class="ti ti-plus"></i>
            Nuevo
          </button>
        </div>
        <div class="apple-card-body">
          <table class="table-apple">
            <thead>
              <tr><th>Código</th><th>Nombre</th><th>Categoría</th><th>Precio</th><th>Stock</th><th>Acciones</th></tr>
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
        <td><span class="badge">${a.categoria}</span></td>
        <td>$${a.precio.toLocaleString('es-AR')}</td>
        <td>${a.stock}</td>
        <td>
          <button class="apple-btn apple-btn-secondary" data-action="edit" data-id="${a.id}">
            <i class="ti ti-pencil"></i>
          </button>
          <button class="apple-btn" style="background: var(--error); color: white;" data-action="delete" data-id="${a.id}">
            <i class="ti ti-trash"></i>
          </button>
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
        const confirm = await Modal.confirm('¿Eliminar este artículo?');
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
            <input type="text" name="categoria" value="${articulo?.categoria || ''}">
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
      const data = Object.fromEntries(new FormData(document.getElementById('articuloForm')));
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
      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-users"></i>
            Gestión de Clientes
          </h3>
          <button class="apple-btn apple-btn-primary" id="btnNuevoCliente">
            <i class="ti ti-plus"></i>
            Nuevo
          </button>
        </div>
        <div class="apple-card-body">
          <table class="table-apple">
            <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
            <tbody id="clientesTable"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('clientesTable').innerHTML = clientes.map(c => `
      <tr>
        <td>${c.nombreCliente}</td>
        <td>
          <button class="apple-btn" style="background: var(--error); color: white;" data-action="delete" data-id="${c.id}">
            <i class="ti ti-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    document.getElementById('btnNuevoCliente')?.addEventListener('click', () => this.mostrarFormularioCliente());

    document.getElementById('clientesTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.dataset.action !== 'delete') return;

      const confirm = await Modal.confirm('¿Eliminar este cliente?');
      if (confirm) {
        await ClientesService.delete(btn.dataset.id);
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
      const data = Object.fromEntries(new FormData(document.getElementById('clienteForm')));
      if (cliente) {
        await ClientesService.update(cliente.id, data);
      } else {
        await ClientesService.create(data);
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
      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-credit-card"></i>
            Medios de Pago
          </h3>
          <button class="apple-btn apple-btn-primary" id="btnNuevoMedio">
            <i class="ti ti-plus"></i>
            Nuevo
          </button>
        </div>
        <div class="apple-card-body">
          <table class="table-apple">
            <thead><tr><th>Nombre</th><th>Acciones</th></tr></thead>
            <tbody id="mediosTable"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('mediosTable').innerHTML = medios.map(m => `
      <tr>
        <td>${m.nombre}</td>
        <td>
          <button class="apple-btn" style="background: var(--error); color: white;" data-action="delete" data-id="${m.id}">
            <i class="ti ti-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    document.getElementById('btnNuevoMedio')?.addEventListener('click', () => this.mostrarFormularioMedio());

    document.getElementById('mediosTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.dataset.action !== 'delete') return;

      const confirm = await Modal.confirm('¿Eliminar método?');
      if (confirm) {
        await MediosPagoService.delete(btn.dataset.id);
        this.renderMediosPago();
      }
    });
  },

  mostrarFormularioMedio(medio = null) {
    const content = `
      <form id="medioForm">
        <div class="input-group">
          <label>Nombre</label>
          <input type="text" name="nombre" value="${medio?.nombre || ''}" required>
        </div>
      </form>
    `;

    const buttons = [
      { id: 'btnGuardar', text: 'Guardar', type: 'primary' },
      { id: 'btnCancelar', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: medio ? 'Editar Método' : 'Nuevo Método',
      content,
      buttons
    });

    document.getElementById('btnGuardar')?.addEventListener('click', async () => {
      const data = Object.fromEntries(new FormData(document.getElementById('medioForm')));
      if (medio) {
        await MediosPagoService.update(medio.id, data);
      } else {
        await MediosPagoService.create(data);
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
      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-receipt"></i>
            Historial de Ventas
          </h3>
          <button class="apple-btn apple-btn-secondary" id="btnExportarVentas">
            <i class="ti ti-file-spreadsheet"></i>
            Exportar CSV
          </button>
        </div>
        <div class="apple-card-body">
          <table class="table-apple">
            <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Método</th></tr></thead>
            <tbody id="ventasTable"></tbody>
          </table>
        </div>
      </div>
    `;

    const tbody = document.getElementById('ventasTable');
    tbody.innerHTML = ventas.length === 0
      ? '<tr><td colspan="5" class="empty-state">No hay ventas</td></tr>'
      : ventas.map(v => `
        <tr>
          <td>${v.idVenta.substring(0, 8)}...</td>
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
      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-settings"></i>
            Datos del Negocio
          </h3>
        </div>
        <div class="apple-card-body">
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
            <div class="form-row">
              <div class="input-group">
                <label>WhatsApp</label>
                <input type="text" name="whatsapp" value="${datos.whatsapp || ''}">
              </div>
              <div class="input-group">
                <label>Dirección</label>
                <input type="text" name="direccion" value="${datos.direccion || ''}">
              </div>
            </div>
            <button type="submit" class="apple-btn apple-btn-primary">
              <i class="ti ti-check"></i>
              Guardar
            </button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('negocioForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      await DatosNegocioService.update(data);
      Modal.alert('Datos actualizados', 'success');
    });
  },

  async renderCategorias() {
    const content = document.getElementById('tabContent');
    const categorias = await CategoriasService.getAll();

    content.innerHTML = `
      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-tag"></i>
            Gestión de Categorías
          </h3>
          <button class="apple-btn apple-btn-primary" id="btnNuevaCategoria">
            <i class="ti ti-plus"></i>
            Nueva
          </button>
        </div>
        <div class="apple-card-body">
          <table class="table-apple">
            <thead><tr><th>Color</th><th>Nombre</th><th>Acciones</th></tr></thead>
            <tbody id="categoriasTable"></tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('categoriasTable').innerHTML = categorias.map(c => `
      <tr>
        <td><span class="categoria-color" style="background: ${c.color}; width: 20px; height: 20px; border-radius: 50%; display: inline-block;"></span></td>
        <td>${c.nombre}</td>
        <td>
          <button class="apple-btn" style="background: var(--error); color: white;" data-action="delete" data-id="${c.id}">
            <i class="ti ti-trash"></i>
          </button>
        </td>
      </tr>
    `).join('');

    document.getElementById('btnNuevaCategoria')?.addEventListener('click', () => this.mostrarFormularioCategoria());

    document.getElementById('categoriasTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn || btn.dataset.action !== 'delete') return;

      const confirm = await Modal.confirm('¿Eliminar?');
      if (confirm) {
        await CategoriasService.delete(btn.dataset.id);
        this.renderCategorias();
      }
    });
  },

  mostrarFormularioCategoria(categoria = null) {
    const content = `
      <form id="categoriaForm">
        <div class="form-row">
          <div class="input-group">
            <label>Nombre</label>
            <input type="text" name="nombre" value="${categoria?.nombre || ''}" required>
          </div>
          <div class="input-group">
            <label>Color</label>
            <input type="color" name="color" value="${categoria?.color || '#6366f1'}">
          </div>
        </div>
      </form>
    `;

    const buttons = [
      { id: 'btnGuardar', text: 'Guardar', type: 'primary' },
      { id: 'btnCancelar', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: categoria ? 'Editar' : 'Nueva Categoría',
      content,
      buttons
    });

    document.getElementById('btnGuardar')?.addEventListener('click', async () => {
      const data = Object.fromEntries(new FormData(document.getElementById('categoriaForm')));
      if (categoria) {
        await CategoriasService.update(categoria.id, data);
      } else {
        await CategoriasService.create(data);
      }
      Modal.close(modal);
      this.renderCategorias();
    });

    document.getElementById('btnCancelar')?.addEventListener('click', () => Modal.close(modal));
  },

  setupEvents() {
    document.querySelector('.tabs-apple')?.addEventListener('click', async (e) => {
      const tab = e.target.closest('.tab-apple');
      if (!tab) return;

      document.querySelectorAll('.tab-apple').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const tabName = tab.dataset.tab;

      Object.keys(this.charts).forEach(key => {
        if (this.charts[key]) {
          this.charts[key].destroy();
          this.charts[key] = null;
        }
      });

      switch (tabName) {
        case 'metricas': await this.renderMetricas(); break;
        case 'articulos': await this.renderArticulos(); break;
        case 'categorias': await this.renderCategorias(); break;
        case 'clientes': await this.renderClientes(); break;
        case 'medios': await this.renderMediosPago(); break;
        case 'ventas': await this.renderVentas(); break;
        case 'negocio': await this.renderNegocio(); break;
      }
    });
  }
};

window.DashboardPage = DashboardPage;