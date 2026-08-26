/* ==========================================================================
   helpers.js — utilidades de UI: toasts, modales, confirmaciones, DOM
   ========================================================================== */

/* ---------------------------------------------------------------------- */
/* Seguridad: escape de texto para inserción segura en el DOM              */
/* ---------------------------------------------------------------------- */

export function escaparHTML(texto) {
  const div = document.createElement('div');
  div.textContent = texto === undefined || texto === null ? '' : String(texto);
  return div.innerHTML;
}

/* ---------------------------------------------------------------------- */
/* Toasts                                                                  */
/* ---------------------------------------------------------------------- */

function _obtenerToastStack() {
  let stack = document.querySelector('.toast-stack');
  if (!stack) {
    stack = document.createElement('div');
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}

const ICONOS_TOAST = {
  success: '✓',
  danger: '✕',
  warning: '⚠',
  info: 'ℹ',
};

export function mostrarToast(mensaje, tipo = 'success', duracion = 3200) {
  const stack = _obtenerToastStack();
  const toast = document.createElement('div');
  toast.className = `toast toast-${tipo}`;
  toast.innerHTML = `<span>${ICONOS_TOAST[tipo] || ''}</span><span>${escaparHTML(mensaje)}</span>`;
  stack.appendChild(toast);

  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 200);
  }, duracion);
}

/* ---------------------------------------------------------------------- */
/* Modales genéricos                                                       */
/* ---------------------------------------------------------------------- */

export function abrirModal(idOverlay) {
  const overlay = document.getElementById(idOverlay);
  if (!overlay) return;
  overlay.classList.add('is-open');
  document.body.style.overflow = 'hidden';
}

export function cerrarModal(idOverlay) {
  const overlay = document.getElementById(idOverlay);
  if (!overlay) return;
  overlay.classList.remove('is-open');
  document.body.style.overflow = '';
}

/** Cierra el modal al hacer click en el overlay (fuera del contenido) o en [data-cerrar-modal]. */
export function inicializarCierreModales() {
  document.querySelectorAll('.modal-overlay').forEach((overlay) => {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) cerrarModal(overlay.id);
    });
  });
  document.querySelectorAll('[data-cerrar-modal]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const overlay = btn.closest('.modal-overlay');
      if (overlay) cerrarModal(overlay.id);
    });
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      document.querySelectorAll('.modal-overlay.is-open').forEach((o) => cerrarModal(o.id));
    }
  });
}

/**
 * Muestra un modal de confirmación genérico y ejecuta el callback si el
 * usuario confirma. Reutiliza el modal #modal-confirmar del layout compartido.
 */
export function confirmarAccion({ titulo = '¿Estás seguro?', mensaje = 'Esta acción no se puede deshacer.', textoConfirmar = 'Eliminar', onConfirmar }) {
  const overlay = document.getElementById('modal-confirmar');
  if (!overlay) {
    if (window.confirm(mensaje)) onConfirmar?.();
    return;
  }
  overlay.querySelector('.confirm-titulo').textContent = titulo;
  overlay.querySelector('.confirm-mensaje').textContent = mensaje;
  const btnConfirmar = overlay.querySelector('.confirm-btn-aceptar');
  btnConfirmar.textContent = textoConfirmar;

  const nuevoBtn = btnConfirmar.cloneNode(true);
  btnConfirmar.parentNode.replaceChild(nuevoBtn, btnConfirmar);
  nuevoBtn.addEventListener('click', () => {
    cerrarModal('modal-confirmar');
    onConfirmar?.();
  });

  abrirModal('modal-confirmar');
}

/* ---------------------------------------------------------------------- */
/* Varios                                                                   */
/* ---------------------------------------------------------------------- */

export function debounce(fn, espera = 250) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), espera);
  };
}

export function obtenerParametroURL(nombre) {
  return new URLSearchParams(window.location.search).get(nombre);
}

export function crearElemento(html) {
  const template = document.createElement('template');
  template.innerHTML = html.trim();
  return template.content.firstElementChild;
}

/**
 * Descarga contenido de texto como archivo en la PC del usuario
 * (respaldo de datos, comprobantes, cierres de caja, etc.).
 */
export function descargarArchivo(nombreArchivo, contenido, tipoMime = 'text/plain') {
  const blob = new Blob([contenido], { type: tipoMime });
  const url = URL.createObjectURL(blob);
  const enlace = document.createElement('a');
  enlace.href = url;
  enlace.download = nombreArchivo;
  document.body.appendChild(enlace);
  enlace.click();
  document.body.removeChild(enlace);
  URL.revokeObjectURL(url);
}

/* ---------------------------------------------------------------------- */
/* Fotos de producto                                                       */
/* ---------------------------------------------------------------------- */

/**
 * Verifica si un valor de "imagen" de producto es una foto (data URL)
 * en vez de un icono/emoji.
 */
export function esImagenDataURL(valor) {
  return typeof valor === 'string' && valor.startsWith('data:image');
}

/**
 * Lee un archivo de imagen seleccionado por el usuario, lo redimensiona y
 * comprime en el navegador (usando <canvas>) y devuelve un data URL listo
 * para guardarse en localStorage sin ocupar demasiado espacio.
 */
export function redimensionarImagen(archivo, ladoMaximo = 320, calidad = 0.75) {
  return new Promise((resolve, reject) => {
    if (!archivo || !archivo.type.startsWith('image/')) {
      reject(new Error('Selecciona un archivo de imagen válido (JPG, PNG, WEBP...).'));
      return;
    }
    const lector = new FileReader();
    lector.onerror = () => reject(new Error('No se pudo leer la imagen seleccionada.'));
    lector.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('El archivo seleccionado no es una imagen válida.'));
      img.onload = () => {
        const escala = Math.min(1, ladoMaximo / Math.max(img.width, img.height));
        const ancho = Math.round(img.width * escala);
        const alto = Math.round(img.height * escala);
        const canvas = document.createElement('canvas');
        canvas.width = ancho;
        canvas.height = alto;
        canvas.getContext('2d').drawImage(img, 0, 0, ancho, alto);
        resolve(canvas.toDataURL('image/jpeg', calidad));
      };
      img.src = lector.result;
    };
    lector.readAsDataURL(archivo);
  });
}
