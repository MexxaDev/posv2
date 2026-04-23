const Modal = {
  show(options) {
    const { title, content, buttons = [], onClose } = options;

    const modal = document.createElement('div');
    modal.className = 'modal-overlay show';
    modal.innerHTML = `
      <div class="modal-container">
        <div class="modal-header">
          <h3>${title}</h3>
          <button class="modal-close">&times;</button>
        </div>
        <div class="modal-body">${content}</div>
        ${buttons.length ? `<div class="modal-footer">${buttons.map(b => `<button class="btn btn-${b.type || 'secondary'}" id="${b.id}">${b.text}</button>`).join('')}</div>` : ''}
      </div>
    `;

    document.body.appendChild(modal);

    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      this.close(modal);
      if (onClose) onClose();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        this.close(modal);
        if (onClose) onClose();
      }
    });

    return modal;
  },

  close(modal) {
    modal.classList.remove('show');
    modal.style.opacity = '0';
    modal.style.transform = 'scale(0.95)';
    setTimeout(() => modal.remove(), 200);
  },

  alert(message, type = 'info') {
    const toast = document.getElementById('toast') || this.createToast();
    toast.textContent = message;
    toast.className = `toast toast-${type} show`;
    setTimeout(() => toast.classList.remove('show'), 3000);
  },

  createToast() {
    const toast = document.createElement('div');
    toast.id = 'toast';
    document.body.appendChild(toast);
    return toast;
  },

  confirm(message) {
    return new Promise((resolve) => {
      const content = `<p class="confirm-message" style="text-align: center; padding: 10px 0;">${message}</p>`;
      const buttons = [
        { id: 'confirm-yes', text: 'Sí, confirmar', type: 'primary' },
        { id: 'confirm-no', text: 'Cancelar', type: 'secondary' }
      ];

      const modal = this.show({
        title: 'Confirmar',
        content,
        buttons,
        onClose: () => resolve(false)
      });

      document.getElementById('confirm-yes')?.addEventListener('click', () => {
        this.close(modal);
        resolve(true);
      });

      document.getElementById('confirm-no')?.addEventListener('click', () => {
        this.close(modal);
        resolve(false);
      });
    });
  }
};

window.Modal = Modal;
