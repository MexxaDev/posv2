const BackupService = {
  async exportData() {
    try {
      const data = {};
      
      const articulos = await Database.getAll('articulos');
      const categorias = await Database.getAll('categorias');
      const clientes = await Database.getAll('clientes');
      const ventas = await Database.getAll('ventas');
      const caja = await Database.getAll('caja');
      const mediosPago = await Database.getAll('medios_pago');
      const datosNegocio = await Database.getAll('datos_negocio');

      data.version = 1;
      data.fechaexport = new Date().toISOString();
      data.articulos = articulos;
      data.categorias = categorias;
      data.clientes = clientes;
      data.ventas = ventas;
      data.caja = caja;
      data.mediospago = mediosPago;
      data.datosnegocio = datosNegocio;

      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `levitar_backup_${new Date().toISOString().split('T')[0]}.json`;
      link.click();
      URL.revokeObjectURL(url);
      
      console.log('BackupService: Exportación completada');
      return true;
    } catch (e) {
      console.error('BackupService: Error al exportar:', e);
      return false;
    }
  },

  async importData(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      
      if (!data.version || !data.articulos) {
        throw new Error('Archivo de backup inválido');
      }

      if (data.articulos) {
        if (typeof Database !== 'undefined') {
          await Database.clear('articulos');
          for (const item of data.articulos) {
            await Database.put('articulos', item);
          }
        }
        localStorage.setItem('pos_data_articulos.json', JSON.stringify(data.articulos));
      }

      if (data.categorias) {
        if (typeof Database !== 'undefined') {
          await Database.clear('categorias');
          for (const item of data.categorias) {
            await Database.put('categorias', item);
          }
        }
        localStorage.setItem('pos_data_categorias.json', JSON.stringify(data.categorias));
      }

      if (data.clientes) {
        if (typeof Database !== 'undefined') {
          await Database.clear('clientes');
          for (const item of data.clientes) {
            await Database.put('clientes', item);
          }
        }
        localStorage.setItem('pos_data_clientes.json', JSON.stringify(data.clientes));
      }

      if (data.ventas) {
        if (typeof Database !== 'undefined') {
          await Database.clear('ventas');
          for (const item of data.ventas) {
            await Database.put('ventas', item);
          }
        }
        localStorage.setItem('pos_data_ventas.json', JSON.stringify(data.ventas));
      }

      if (data.caja) {
        if (typeof Database !== 'undefined') {
          await Database.clear('caja');
          if (Array.isArray(data.caja)) {
            for (const item of data.caja) {
              await Database.put('caja', item);
            }
          } else {
            await Database.put('caja', data.caja);
          }
        }
        localStorage.setItem('pos_data_caja.json', JSON.stringify(data.caja));
      }

      if (data.mediospago) {
        if (typeof Database !== 'undefined') {
          await Database.clear('medios_pago');
          for (const item of data.mediospago) {
            await Database.put('medios_pago', item);
          }
        }
        localStorage.setItem('pos_data_medios_pago.json', JSON.stringify(data.mediospago));
      }

      if (data.datosnegocio) {
        if (typeof Database !== 'undefined') {
          await Database.clear('datos_negocio');
          if (Array.isArray(data.datosnegocio)) {
            for (const item of data.datosnegocio) {
              await Database.put('datos_negocio', item);
            }
          } else {
            await Database.put('datos_negocio', data.datosnegocio);
          }
        }
        localStorage.setItem('pos_data_datos_negocio.json', JSON.stringify(data.datosnegocio));
      }

      window.location.reload();
      return true;
    } catch (e) {
      console.error('BackupService: Error al importar:', e);
      return false;
    }
  },

  showImportDialog() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async (event) => {
        const success = await this.importData(event.target.result);
        if (success) {
          alert('Datos importados correctamente. La página se recargará.');
        } else {
          alert('Error al importar datos. Verifique el archivo.');
        }
      };
      reader.readAsText(file);
    };
    input.click();
  }
};

window.BackupService = BackupService;