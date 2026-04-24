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
          <button class="tab-apple" data-tab="caja">
            <i class="ti ti-cash-register"></i>
            Caja
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

        <div class="metric-card-apple" id="cardCajaEstado" style="cursor: pointer;" title="Ver detalles de caja">
          <div class="metric-icon-apple">
            <i class="ti ti-cash-register"></i>
          </div>
          <div class="metric-info-apple">
            <span class="metric-value-apple" id="metricCaja">Cargando...</span>
            <span class="metric-label-apple">Caja</span>
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
    const cajaResumen = await CajaService.getResumen();
    const cajaAbierta = await CajaService.estaAbierta();

    document.getElementById('metricVentas').textContent = ventas;
    document.getElementById('metricIngresos').textContent = '$' + ingresos.toLocaleString('es-AR');
    document.getElementById('metricTicketProm').textContent = '$' + ticketProm.toLocaleString('es-AR');
    document.getElementById('metricItemsProm').textContent = itemsProm;
    document.getElementById('metricStock').textContent = productosStock;
    document.getElementById('metricClientes').textContent = clientesCount;

    const cajaCard = document.getElementById('cardCajaEstado');
    if (cajaCard) {
      const saldoCaja = cajaResumen.saldoTeorico || 0;
      const ingresosDia = cajaResumen.movimientosIngresos || 0;
      const egresosDia = cajaResumen.movimientosEgresos || 0;
      const labelCaja = cajaAbierta 
        ? `Abierta ($${saldoCaja.toLocaleString('es-AR')})`
        : 'Cerrada';
      document.getElementById('metricCaja').textContent = labelCaja;
      document.getElementById('metricCaja').title = `Ingresos: $${ingresosDia.toLocaleString('es-AR')} | Egresos: $${egresosDia.toLocaleString('es-AR')} | Total: $${saldoCaja.toLocaleString('es-AR')}`;
      cajaCard.style.background = cajaAbierta ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    }

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
              <td>${v.items || 0}</td>
              <td>$${(v.montoTotal || v.monto).toLocaleString('es-AR')}</td>
              <td>${(v.mediosPago || []).map(mp => mp.medio).join(' + ') || v.medioPago || '-'}</td>
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
    const categorias = await ArticulosService.getCategorias();
    
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
            <select name="categoria">
              <option value="">Seleccionar...</option>
              ${categorias.map(c => `<option value="${c}" ${articulo?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label>Precio</label>
            <input type="number" name="precio" value="${articulo?.precio || ''}" required>
          </div>
        </div>
        <div class="form-row-full">
          <div class="input-group">
            <label>Stock</label>
            <input type="number" name="stock" value="${articulo?.stock || 0}">
          </div>
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
    const medios = await MediosPagoService.getNombres();

    content.innerHTML = `
      <div class="filters-apple">
        <div class="filter-group-apple">
          <label>Desde</label>
          <input type="date" id="filtroVentasInicio" value="${this.filtros.fechaInicio || ''}">
        </div>
        <div class="filter-group-apple">
          <label>Hasta</label>
          <input type="date" id="filtroVentasFin" value="${this.filtros.fechaFin || ''}">
        </div>
        <div class="filter-group-apple">
          <label>Método</label>
          <select id="filtroVentasMedio">
            <option value="">Todos</option>
            ${medios.map(m => `<option value="${m}">${m}</option>`).join('')}
          </select>
        </div>
        <div class="filter-group-apple">
          <label>Cliente</label>
          <input type="text" id="filtroVentasCliente" placeholder="Buscar cliente...">
        </div>
        <div class="filter-group-apple">
          <label>Monto Mín</label>
          <input type="number" id="filtroVentasMontoMin" placeholder="0">
        </div>
        <div class="filter-group-apple">
          <label>Monto Máx</label>
          <input type="number" id="filtroVentasMontoMax" placeholder="999999">
        </div>
        <div class="filter-actions-apple">
          <button class="apple-btn apple-btn-primary" id="btnAplicarFiltrosVentas">
            <i class="ti ti-check"></i>
            Filtrar
          </button>
          <button class="apple-btn apple-btn-secondary" id="btnLimpiarFiltrosVentas">
            <i class="ti ti-x"></i>
            Limpiar
          </button>
        </div>
      </div>

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
            <thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Monto</th><th>Método</th><th>Acciones</th></tr></thead>
            <tbody id="ventasTable"></tbody>
          </table>
        </div>
      </div>
    `;

    await this.cargarVentas();
    this.setupVentasEvents();
  },

  async cargarVentas() {
    const filtros = {
      fechaInicio: document.getElementById('filtroVentasInicio')?.value,
      fechaFin: document.getElementById('filtroVentasFin')?.value,
      medioPago: document.getElementById('filtroVentasMedio')?.value,
      cliente: document.getElementById('filtroVentasCliente')?.value,
      montoMin: document.getElementById('filtroVentasMontoMin')?.value,
      montoMax: document.getElementById('filtroVentasMontoMax')?.value
    };

    const ventas = await VentasService.getVentasFiltradas(filtros);
    const ventasOrdenadas = ventas.reverse();

    const tbody = document.getElementById('ventasTable');
    tbody.innerHTML = ventasOrdenadas.length === 0
      ? '<tr><td colspan="6" class="empty-state">No hay ventas</td></tr>'
      : ventasOrdenadas.map(v => `
        <tr>
          <td>${v.idVenta?.substring(0, 8) || '-'}...</td>
          <td>${new Date(v.fecha).toLocaleString('es-AR')}</td>
          <td>${v.cliente}</td>
          <td>$${(v.montoTotal || v.monto).toLocaleString('es-AR')}</td>
          <td>${(v.mediosPago || []).map(mp => mp.medio).join(' + ') || v.medioPago || '-'}</td>
          <td>
            <button class="apple-btn apple-btn-secondary" data-action="view" data-id="${v.idVenta}" title="Ver">
              <i class="ti ti-eye"></i>
            </button>
            <button class="apple-btn apple-btn-secondary" data-action="print" data-id="${v.idVenta}" title="Imprimir">
              <i class="ti ti-printer"></i>
            </button>
          </td>
        </tr>
      `).join('');
  },

  setupVentasEvents() {
    document.getElementById('btnAplicarFiltrosVentas')?.addEventListener('click', () => {
      this.cargarVentas();
    });

    document.getElementById('btnLimpiarFiltrosVentas')?.addEventListener('click', () => {
      document.getElementById('filtroVentasInicio').value = '';
      document.getElementById('filtroVentasFin').value = '';
      document.getElementById('filtroVentasMedio').value = '';
      document.getElementById('filtroVentasCliente').value = '';
      document.getElementById('filtroVentasMontoMin').value = '';
      document.getElementById('filtroVentasMontoMax').value = '';
      this.cargarVentas();
    });

    document.getElementById('btnExportarVentas')?.addEventListener('click', () => {
      const filtros = {
        fechaInicio: document.getElementById('filtroVentasInicio')?.value,
        fechaFin: document.getElementById('filtroVentasFin')?.value,
        medioPago: document.getElementById('filtroVentasMedio')?.value,
        cliente: document.getElementById('filtroVentasCliente')?.value,
        montoMin: document.getElementById('filtroVentasMontoMin')?.value,
        montoMax: document.getElementById('filtroVentasMontoMax')?.value
      };
      VentasService.descargarCSV(filtros);
    });

    document.getElementById('ventasTable')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'view') {
        const venta = await VentasService.getById(id);
        if (venta) {
          this.mostrarDetalleVenta(venta);
        }
      } else if (action === 'print') {
        const venta = await VentasService.getById(id);
        if (venta) {
          this.imprimirVenta(venta);
        }
      }
    });
  },

  async mostrarDetalleVenta(venta) {
    const datos = await DatosNegocioService.get();
    const mediosStr = (venta.mediosPago || []).map(mp => mp.medio + ': $' + mp.monto.toLocaleString('es-AR')).join(' + ') || venta.medioPago || '-';
    const descuentoHtml = venta.descuento > 0 
      ? '<div class="ticket-summary-row" style="color: var(--error);"><span>Descuento:</span><span>-$' + venta.descuento.toLocaleString('es-AR') + '</span></div>' 
      : '';
    const articulosHtml = (venta.articulos || []).map(item => 
      '<div class="ticket-item">' +
        '<span class="ticket-item-name">' + item.nombre + '</span>' +
        '<span class="ticket-item-qty">x' + item.cantidad + '</span>' +
        '<span class="ticket-item-price">$' + (item.precio * item.cantidad).toLocaleString('es-AR') + '</span>' +
      '</div>'
    ).join('') || '';
    
    const content = '<div class="ticket-modal" style="max-width: 360px; margin: 0 auto;">' +
      '<div class="ticket-header"><h3>' + datos.nombre + '</h3></div>' +
      '<div style="font-size: 12px; margin-bottom: 12px; padding-bottom: 12px; border-bottom: 1px dashed #ccc;">' +
        '<p><strong>Fecha:</strong> ' + new Date(venta.fecha).toLocaleString('es-AR') + '</p>' +
        '<p><strong>ID:</strong> ' + venta.idVenta + '</p>' +
        '<p><strong>Cliente:</strong> ' + venta.cliente + '</p>' +
        (venta.nota ? '<p><strong>Nota:</strong> ' + venta.nota + '</p>' : '') +
      '</div>' +
      '<div class="ticket-items">' + articulosHtml + '</div>' +
      '<div class="ticket-summary">' +
        '<div class="ticket-summary-row"><span>Subtotal:</span><span>$' + (venta.subtotal || 0).toLocaleString('es-AR') + '</span></div>' +
        descuentoHtml +
        '<div class="ticket-summary-row total"><span>TOTAL:</span><span>$' + (venta.montoTotal || venta.monto).toLocaleString('es-AR') + '</span></div>' +
      '</div>' +
      '<div class="ticket-footer"><p><strong>Pago:</strong> ' + mediosStr + '</p></div>' +
    '</div>';

    const buttons = [
      { id: 'btnCerrarDetalle', text: 'Cerrar', type: 'primary' }
    ];

    const modal = Modal.show({
      title: 'Detalle de Venta',
      content,
      buttons
    });

    document.getElementById('btnCerrarDetalle')?.addEventListener('click', () => {
      Modal.close(modal);
    });
  },

  async imprimirVenta(venta) {
    const datos = await DatosNegocioService.get();
    const mediosStr = (venta.mediosPago || []).map(mp => mp.medio + ': $' + mp.monto.toLocaleString('es-AR')).join(' + ') || venta.medioPago || '-';
    const descuentoHtml = venta.descuento > 0 ? '<p style="font-size: 11px; text-align: right; color: red;"><strong>Descuento:</strong> -$' + venta.descuento.toLocaleString('es-AR') + '</p>' : '';
    const articulosHtml = (venta.articulos || []).map(item => 
      '<tr><td style="text-align: left;">' + item.nombre + ' x' + item.cantidad + '</td><td style="text-align: right;">$' + (item.precio * item.cantidad).toLocaleString('es-AR') + '</td></tr>'
    ).join('') || '';
    
    const ticketHTML = '<div style="font-family: \'Courier New\', monospace; padding: 20px; max-width: 280px; margin: 0 auto; text-align: center;">' +
      '<h3 style="margin: 0 0 10px 0;">' + datos.nombre + '</h3>' +
      '<p style="font-size: 11px; margin: 0 0 10px 0;">' + (datos.direccion || '') + ' ' + (datos.telefono || '') + '</p>' +
      '<hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">' +
      '<p style="font-size: 11px; text-align: left;"><strong>Fecha:</strong> ' + new Date(venta.fecha).toLocaleString('es-AR') + '</p>' +
      '<p style="font-size: 11px; text-align: left;"><strong>Cliente:</strong> ' + venta.cliente + '</p>' +
      '<hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">' +
      '<table style="width: 100%; font-size: 11px; margin-bottom: 10px;">' + articulosHtml + '</table>' +
      '<hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">' +
      '<p style="font-size: 11px; text-align: right;"><strong>Subtotal:</strong> $' + (venta.subtotal || 0).toLocaleString('es-AR') + '</p>' +
      descuentoHtml +
      '<p style="font-size: 14px; text-align: right;"><strong>TOTAL:</strong> $' + (venta.montoTotal || venta.monto).toLocaleString('es-AR') + '</p>' +
      '<hr style="border: none; border-top: 1px dashed #000; margin: 10px 0;">' +
      '<p style="font-size: 11px;"><strong>Pago:</strong> ' + mediosStr + '</p>' +
      '<p style="font-size: 11px; margin-top: 20px;">¡Gracias por su compra!</p>' +
    '</div>';

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Ticket - ${venta.idVenta}</title>
        </head>
        <body>${ticketHTML}</body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
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

      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-download"></i>
            Copia de Seguridad
          </h3>
        </div>
        <div class="apple-card-body">
          <p style="margin-bottom: 16px; color: var(--apple-text-secondary);">
            Exporta todos tus datos (artículos, clientes, ventas, categorías) o importa una copia de seguridad anterior.
          </p>
          <div style="display: flex; gap: 12px; flex-wrap: wrap;">
            <button class="apple-btn apple-btn-primary" id="btnExportBackup">
              <i class="ti ti-download"></i>
              Exportar Backup
            </button>
            <button class="apple-btn apple-btn-secondary" id="btnImportBackup">
              <i class="ti ti-upload"></i>
              Importar Backup
            </button>
          </div>
        </div>
      </div>
    `;

    document.getElementById('negocioForm')?.addEventListener('submit', async (e) => {
      e.preventDefault();
      const data = Object.fromEntries(new FormData(e.target));
      await DatosNegocioService.update(data);
      Modal.alert('Datos actualizados', 'success');
    });

    document.getElementById('btnExportBackup')?.addEventListener('click', async () => {
      if (confirm('¿Exportar todos los datos? Se descargará un archivo JSON.')) {
        const success = await BackupService.exportData();
        if (success) {
          Modal.alert('Backup exportado correctamente', 'success');
        } else {
          Modal.alert('Error al exportar backup', 'error');
        }
      }
    });

    document.getElementById('btnImportBackup')?.addEventListener('click', () => {
      if (confirm('⚠️ Los datos actuales se reemplazarán con los del archivo. ¿Continuar?')) {
        BackupService.showImportDialog();
      }
    });
  },

  async renderCaja() {
    const content = document.getElementById('tabContent');
    const cajaEstado = await CajaService.getEstado();
    const movimientos = await CajaService.getMovimientos();
    const resumen = await CajaService.getResumen();
    const cajaAbierta = await CajaService.estaAbierta();

    const movimientosHoy = movimientos.filter(m => {
      const hoy = new Date().toISOString().split('T')[0];
      return m.fecha.startsWith(hoy);
    }).reverse();

    content.innerHTML = `
      <div class="apple-card">
        <div class="apple-card-header">
          <h3 class="apple-card-title">
            <i class="ti ti-cash-register"></i>
            Gestión de Caja
          </h3>
          <div style="display: flex; gap: 8px;">
            ${cajaAbierta ? `
              <button class="apple-btn" style="background: var(--error);" id="btnForzarCierre">
                <i class="ti ti-power"></i>
                Forzar Cierre
              </button>
            ` : `
              <button class="apple-btn apple-btn-primary" id="btnAbrirCaja">
                <i class="ti ti-plus"></i>
                Abrir Caja
              </button>
            `}
          </div>
        </div>
        <div class="apple-card-body">
          <div class="metrics-grid-apple" style="margin-bottom: 20px;">
            <div class="metric-card-apple">
              <div class="metric-icon-apple">
                <i class="ti ti-cash"></i>
              </div>
              <div class="metric-info-apple">
                <span class="metric-value-apple">${cajaAbierta ? 'Abierta' : 'Cerrada'}</span>
                <span class="metric-label-apple">Estado</span>
              </div>
            </div>
            <div class="metric-card-apple">
              <div class="metric-icon-apple">
                <i class="ti ti-arrow-down"></i>
              </div>
              <div class="metric-info-apple">
                <span class="metric-value-apple" style="color: var(--success);">$${resumen.movimientosIngresos?.toLocaleString('es-AR') || 0}</span>
                <span class="metric-label-apple">Ingresos Hoy</span>
              </div>
            </div>
            <div class="metric-card-apple">
              <div class="metric-icon-apple">
                <i class="ti ti-arrow-up"></i>
              </div>
              <div class="metric-info-apple">
                <span class="metric-value-apple" style="color: var(--error);">$${resumen.movimientosEgresos?.toLocaleString('es-AR') || 0}</span>
                <span class="metric-label-apple">Egresos Hoy</span>
              </div>
            </div>
            <div class="metric-card-apple">
              <div class="metric-icon-apple">
                <i class="ti ti-cash"></i>
              </div>
              <div class="metric-info-apple">
                <span class="metric-value-apple">$${resumen.saldoInicial?.toLocaleString('es-AR') || 0}</span>
                <span class="metric-label-apple">Saldo Inicial</span>
              </div>
            </div>
          </div>

          <h4 style="margin: 20px 0 12px 0;">Movimientos de Hoy</h4>
          <table class="table-apple">
            <thead><tr><th>Hora</th><th>Tipo</th><th>Concepto</th><th>Método</th><th>Monto</th><th>Usuario</th></tr></thead>
            <tbody id="movimientosTable">
              ${movimientosHoy.length === 0 
                ? '<tr><td colspan="6" class="empty-state">No hay movimientos hoy</td></tr>'
                : movimientosHoy.map(m => `
                  <tr>
                    <td>${new Date(m.fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })}</td>
                    <td><span class="badge" style="background: ${m.tipo === 'ingreso' ? 'var(--success)' : 'var(--error)'}">${m.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}</span></td>
                    <td>${m.concepto}</td>
                    <td>${m.medio}</td>
                    <td>$${m.monto.toLocaleString('es-AR')}</td>
                    <td>${m.usuario || '-'}</td>
                  </tr>
                `).join('')
              }
            </tbody>
          </table>
        </div>
      </div>
    `;

    document.getElementById('btnAbrirCaja')?.addEventListener('click', async () => {
      const { value: saldo } = await this.promptMonto('Abrir Caja', 'Ingrese el saldo inicial:');
      if (saldo && !isNaN(saldo)) {
        await CajaService.abrir(saldo);
        this.renderCaja();
      }
    });

    document.getElementById('btnForzarCierre')?.addEventListener('click', async () => {
      if (confirm('¿Forzar el cierre de caja? Esto cerrará la caja sin mostrar el detalle.')) {
        await CajaService.cerrar(0);
        this.renderCaja();
      }
    });
  },

  promptMonto(title, message) {
    return new Promise(resolve => {
      const content = `
        <div class="input-group">
          <label>${message}</label>
          <input type="number" id="promptMonto" min="0" autofocus>
        </div>
      `;
      const buttons = [
        { id: 'btnConfirmar', text: 'Aceptar', type: 'primary' },
        { id: 'btnCancelar', text: 'Cancelar', type: 'secondary' }
      ];
      const modal = Modal.show({ title, content, buttons });
      document.getElementById('btnConfirmar')?.addEventListener('click', () => {
        const value = parseFloat(document.getElementById('promptMonto')?.value) || 0;
        Modal.close(modal);
        resolve({ value });
      });
      document.getElementById('btnCancelar')?.addEventListener('click', () => {
        Modal.close(modal);
        resolve({ value: null });
      });
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
        case 'caja': await this.renderCaja(); break;
        case 'ventas': await this.renderVentas(); break;
        case 'negocio': await this.renderNegocio(); break;
      }
    });

    document.getElementById('cardCajaEstado')?.addEventListener('click', () => {
      document.querySelectorAll('.tab-apple').forEach(t => t.classList.remove('active'));
      document.querySelector('[data-tab="caja"]')?.classList.add('active');
      this.renderCaja();
    });
  }
};

window.DashboardPage = DashboardPage;