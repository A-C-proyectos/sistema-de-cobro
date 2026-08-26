/* ==========================================================================
   proveedores.js — página de gestión de proveedores (pages/proveedores.html)
   ========================================================================== */

let filtroTexto = '';
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  Layout.inicializarLayout({ activo: 'proveedores', titulo: 'Proveedores', subtitulo: 'Directorio de suplidores', dentroDePages: true });
  Modales.inicializarModalConfirmar();
  Helpers.inicializarCierreModales();

  pintarTabla();

  document.getElementById('buscar').addEventListener('input', Helpers.debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarTabla();
  }, 200));

  document.getElementById('btn-nuevo-proveedor').addEventListener('click', () => _abrirFormulario());
  document.getElementById('form-proveedor').addEventListener('submit', _guardarFormulario);
});

function pintarTabla() {
  const proveedores = Storage.obtenerProveedores().filter((p) =>
    !filtroTexto || p.empresa.toLowerCase().includes(filtroTexto) || (p.contacto || '').toLowerCase().includes(filtroTexto)
  );
  const productos = Storage.obtenerProductos();
  const tbody = document.getElementById('tabla-proveedores');

  if (proveedores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">🚚</div><div class="empty-state__title">No hay proveedores registrados</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = proveedores.map((p) => {
    const nProductos = productos.filter((prod) => prod.proveedorId === p.id).length;
    return `
      <tr>
        <td class="cell-strong">${Helpers.escaparHTML(p.empresa)}</td>
        <td>${Helpers.escaparHTML(p.contacto)}</td>
        <td class="cell-mono">${Helpers.escaparHTML(p.telefono || '—')}</td>
        <td class="cell-muted">${Helpers.escaparHTML(p.correo || '—')}</td>
        <td><span class="badge badge-info">${nProductos} producto(s)</span></td>
        <td class="cell-actions">
          <button class="btn btn-outline btn-sm btn-ver" data-id="${p.id}">Ver productos</button>
          <button class="btn btn-outline btn-sm btn-editar" data-id="${p.id}">Editar</button>
          <button class="btn btn-danger btn-sm btn-eliminar" data-id="${p.id}">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-ver').forEach((b) => b.addEventListener('click', () => _verProductos(b.dataset.id)));
  tbody.querySelectorAll('.btn-editar').forEach((b) => b.addEventListener('click', () => _abrirFormulario(b.dataset.id)));
  tbody.querySelectorAll('.btn-eliminar').forEach((b) => b.addEventListener('click', () => _confirmarEliminar(b.dataset.id)));
}

function _abrirFormulario(id = null) {
  editandoId = id;
  const form = document.getElementById('form-proveedor');
  form.reset();
  Validators.aplicarErroresFormulario({});
  document.getElementById('titulo-modal-proveedor').textContent = id ? 'Editar proveedor' : 'Nuevo proveedor';

  if (id) {
    const proveedor = Storage.obtenerProveedores().find((p) => p.id === id);
    if (!proveedor) return;
    document.getElementById('campo-empresa').value = proveedor.empresa;
    document.getElementById('campo-contacto').value = proveedor.contacto;
    document.getElementById('campo-telefono').value = proveedor.telefono || '';
    document.getElementById('campo-correo').value = proveedor.correo || '';
    document.getElementById('campo-direccion').value = proveedor.direccion || '';
  }

  Helpers.abrirModal('modal-proveedor');
}

function _guardarFormulario(e) {
  e.preventDefault();
  const proveedor = {
    empresa: document.getElementById('campo-empresa').value.trim(),
    contacto: document.getElementById('campo-contacto').value.trim(),
    telefono: document.getElementById('campo-telefono').value.trim(),
    correo: document.getElementById('campo-correo').value.trim(),
    direccion: document.getElementById('campo-direccion').value.trim(),
    productos: [],
  };

  const { valido, errores } = Validators.validarProveedor(proveedor);
  if (!valido) {
    Validators.aplicarErroresFormulario(errores);
    return;
  }

  if (editandoId) {
    Storage.actualizarProveedor(editandoId, proveedor);
    Helpers.mostrarToast('✓ Proveedor actualizado correctamente', 'success');
  } else {
    Storage.guardarProveedor(proveedor);
    Helpers.mostrarToast('✓ Proveedor agregado correctamente', 'success');
  }

  Helpers.cerrarModal('modal-proveedor');
  pintarTabla();
}

function _confirmarEliminar(id) {
  const proveedor = Storage.obtenerProveedores().find((p) => p.id === id);
  Helpers.confirmarAccion({
    titulo: 'Eliminar proveedor',
    mensaje: `¿Deseas eliminar a "${proveedor?.empresa}"? Esta acción no se puede deshacer.`,
    onConfirmar: () => {
      Storage.eliminarProveedor(id);
      Helpers.mostrarToast('Proveedor eliminado', 'info');
      pintarTabla();
    },
  });
}

function _verProductos(id) {
  const proveedor = Storage.obtenerProveedores().find((p) => p.id === id);
  if (!proveedor) return;
  const productos = Storage.obtenerProductos().filter((p) => p.proveedorId === id);

  document.getElementById('titulo-productos-proveedor').textContent = `Productos de ${proveedor.empresa}`;
  const cont = document.getElementById('contenido-productos-proveedor');

  if (productos.length === 0) {
    cont.innerHTML = `<div class="empty-state"><div class="empty-state__icon">📦</div><div class="empty-state__title">Este proveedor no tiene productos asignados</div></div>`;
  } else {
    cont.innerHTML = `
      <div class="table-wrap">
        <table class="data-table">
          <thead><tr><th class="no-sort">Producto</th><th class="no-sort">Precio compra</th><th class="no-sort">Stock</th></tr></thead>
          <tbody>
            ${productos.map((p) => `
              <tr>
                <td class="cell-strong">${Helpers.esImagenDataURL(p.imagen) ? `<img src="${p.imagen}" alt="" style="width:20px;height:20px;object-fit:cover;border-radius:4px;vertical-align:middle;margin-right:4px;">` : Helpers.escaparHTML(p.imagen) + ' '}${Helpers.escaparHTML(p.nombre)}</td>
                <td class="cell-mono">${Formatters.formatearMoneda(p.precioCompra)}</td>
                <td class="cell-mono">${Formatters.formatearCantidadUnidad(p.stock, p.unidad)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  Helpers.abrirModal('modal-productos-proveedor');
}
