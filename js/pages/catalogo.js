const CatalogoPage = {
  articulos: [],
  categoriaActual: 'todos',

  async init() {
    if (!Router.requireAuth(null, 'admin')) return;
    this.articulos = await ArticulosService.getAll();
    this.render();
    this.setupEvents();
  },

  render() {
    const main = document.getElementById('mainContent');
    main.innerHTML = `
      <div class="catalogo-page">
        <div class="catalogo-header">
          <h2 class="page-title">Catálogo de Productos</h2>
          <button class="btn btn-primary" id="btnNuevo">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            Nuevo Producto
          </button>
        </div>

        <div class="catalogo-filtros">
          <div class="filtro-categorias" id="filtroCategorias"></div>
          <div class="search-box">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"></circle>
              <path d="m21 21-4.35-4.35"></path>
            </svg>
            <input type="text" id="buscador" placeholder="Buscar productos...">
          </div>
        </div>

        <div class="catalogo-grid" id="catalogoGrid"></div>
      </div>
    `;

    this.renderCategorias();
    this.renderProductos();
  },

  renderCategorias() {
    const container = document.getElementById('filtroCategorias');
    const categorias = [...new Set(this.articulos.map(a => a.categoria))];

    container.innerHTML = `
      <button class="filtro-btn ${this.categoriaActual === 'todos' ? 'active' : ''}" data-cat="todos">Todos</button>
      ${categorias.map(cat => `
        <button class="filtro-btn ${this.categoriaActual === cat ? 'active' : ''}" data-cat="${cat}">${cat}</button>
      `).join('')}
    `;
  },

  renderProductos() {
    const grid = document.getElementById('catalogoGrid');
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
      grid.innerHTML = `
        <div class="empty-state">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"></path>
          </svg>
          <p>No se encontraron productos</p>
        </div>
      `;
      return;
    }

    grid.innerHTML = filtrados.map(a => `
      <div class="producto-card" data-id="${a.id}">
        <div class="producto-card-header">
          <span class="badge badge-success">${a.categoria}</span>
          <span class="producto-stock ${a.stock < 5 ? 'low-stock' : ''}">Stock: ${a.stock}</span>
        </div>
        <div class="producto-card-body">
          <h4>${a.nombre}</h4>
          <p class="producto-codigo">${a.codigo}</p>
          <p class="producto-precio">$${a.precio.toLocaleString('es-AR')}</p>
        </div>
        <div class="producto-card-actions">
          <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${a.id}">Editar</button>
          <button class="btn btn-sm btn-danger" data-action="delete" data-id="${a.id}">Eliminar</button>
        </div>
      </div>
    `).join('');
  },

  setupEvents() {
    document.getElementById('btnNuevo')?.addEventListener('click', () => this.mostrarFormulario());

    document.getElementById('filtroCategorias')?.addEventListener('click', (e) => {
      const btn = e.target.closest('.filtro-btn');
      if (btn) {
        this.categoriaActual = btn.dataset.cat;
        this.renderCategorias();
        this.renderProductos();
      }
    });

    document.getElementById('buscador')?.addEventListener('input', () => {
      this.renderProductos();
    });

    document.getElementById('catalogoGrid')?.addEventListener('click', async (e) => {
      const btn = e.target.closest('button');
      if (!btn) return;

      const action = btn.dataset.action;
      const id = btn.dataset.id;

      if (action === 'edit') {
        const articulo = await ArticulosService.getById(id);
        this.mostrarFormulario(articulo);
      } else if (action === 'delete') {
        const confirm = await Modal.confirm('¿Eliminar este producto?');
        if (confirm) {
          await ArticulosService.delete(id);
          Modal.alert('Producto eliminado', 'success');
          this.articulos = await ArticulosService.getAll();
          this.render();
          this.setupEvents();
        }
      }
    });
  },

  async mostrarFormulario(articulo = null) {
    const catsDB = await CategoriasService.getAll();
    const catsArticulos = [...new Set(this.articulos.map(a => a.categoria))];
    const todasCategorias = [...new Set([...catsDB.map(c => c.nombre), ...catsArticulos])];

    const content = `
      <form id="articuloForm">
        <div class="form-row">
          <div class="input-group">
            <label>Código</label>
            <input type="text" name="codigo" value="${articulo?.codigo || ''}" required ${articulo ? 'readonly' : ''}>
          </div>
          <div class="input-group">
            <label>Nombre</label>
            <input type="text" name="nombre" value="${articulo?.nombre || ''}" required>
          </div>
        </div>
        <div class="form-row">
          <div class="input-group">
            <label>Categoría</label>
            <select name="categoria" required>
              <option value="">Seleccionar categoría</option>
              ${todasCategorias.map(c => `<option value="${c}" ${articulo?.categoria === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="input-group">
            <label>Precio</label>
            <input type="number" name="precio" value="${articulo?.precio || ''}" required>
          </div>
        </div>
        <div class="input-group">
          <label>Stock</label>
          <input type="number" name="stock" value="${articulo?.stock ?? 0}">
        </div>
      </form>
    `;

    const buttons = [
      { id: 'btnSave', text: articulo ? 'Actualizar' : 'Crear', type: 'primary' },
      { id: 'btnCancel', text: 'Cancelar', type: 'secondary' }
    ];

    const modal = Modal.show({
      title: articulo ? 'Editar Producto' : 'Nuevo Producto',
      content,
      buttons
    });

    document.getElementById('btnSave')?.addEventListener('click', async () => {
      const form = document.getElementById('articuloForm');
      const data = Object.fromEntries(new FormData(form));

      if (articulo) {
        await ArticulosService.update(articulo.id, data);
        Modal.alert('Producto actualizado', 'success');
      } else {
        await ArticulosService.create(data);
        Modal.alert('Producto creado', 'success');
      }

      Modal.close(modal);
      this.articulos = await ArticulosService.getAll();
      this.render();
      this.setupEvents();
    });

    document.getElementById('btnCancel')?.addEventListener('click', () => Modal.close(modal));
  }
};

window.CatalogoPage = CatalogoPage;