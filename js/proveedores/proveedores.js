/* ==========================================================================
   proveedores.js — página de gestión de proveedores (pages/proveedores.html)
   ========================================================================== */

import { inicializarLayout } from '../components/layout.js';
import { inicializarModalConfirmar } from '../components/modales.js';
import {
  obtenerProveedores,
  guardarProveedor,
  actualizarProveedor,
  eliminarProveedor,
  obtenerProductos,
} from '../utils/storage.js';
import { validarProveedor, aplicarErroresFormulario } from '../utils/validators.js';
import { formatearMoneda, formatearCantidadUnidad } from '../utils/formatters.js';
import { mostrarToast, abrirModal, cerrarModal, confirmarAccion, escaparHTML, debounce, inicializarCierreModales } from '../utils/helpers.js';

let filtroTexto = '';
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializarLayout({ activo: 'proveedores', titulo: 'Proveedores', subtitulo: 'Directorio de suplidores', dentroDePages: true });
  inicializarModalConfirmar();
  inicializarCierreModales();

  pintarTabla();

  document.getElementById('buscar').addEventListener('input', debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarTabla();
  }, 200));

  document.getElementById('btn-nuevo-proveedor').addEventListener('click', () => _abrirFormulario());
  document.getElementById('form-proveedor').addEventListener('submit', _guardarFormulario);
});

function pintarTabla() {
  const proveedores = obtenerProveedores().filter((p) =>
    !filtroTexto || p.empresa.toLowerCase().includes(filtroTexto) || (p.contacto || '').toLowerCase().includes(filtroTexto)
  );
  const productos = obtenerProductos();
  const tbody = document.getElementById('tabla-proveedores');

  if (proveedores.length === 0) {
    tbody.innerHTML = `<tr><td colspan="6"><div class="empty-state"><div class="empty-state__icon">🚚</div><div class="empty-state__title">No hay proveedores registrados</div></div></td></tr>`;
    return;
  }

  tbody.innerHTML = proveedores.map((p) => {
    const nProductos = productos.filter((prod) => prod.proveedorId === p.id).length;
    return `
      <tr>
        <td class="cell-strong">${escaparHTML(p.empresa)}</td>
        <td>${escaparHTML(p.contacto)}</td>
        <td class="cell-mono">${escaparHTML(p.telefono || '—')}</td>
        <td class="cell-muted">${escaparHTML(p.correo || '—')}</td>
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
  aplicarErroresFormulario({});
  document.getElementById('titulo-modal-proveedor').textContent = id ? 'Editar proveedor' : 'Nuevo proveedor';

  if (id) {
    const proveedor = obtenerProveedores().find((p) => p.id === id);
    if (!proveedor) return;
    document.getElementById('campo-empresa').value = proveedor.empresa;
    document.getElementById('campo-contacto').value = proveedor.contacto;
    document.getElementById('campo-telefono').value = proveedor.telefono || '';
    document.getElementById('campo-correo').value = proveedor.correo || '';
    document.getElementById('campo-direccion').value = proveedor.direccion || '';
  }

  abrirModal('modal-proveedor');
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

  const { valido, errores } = validarProveedor(proveedor);
  if (!valido) {
    aplicarErroresFormulario(errores);
    return;
  }

  if (editandoId) {
    actualizarProveedor(editandoId, proveedor);
    mostrarToast('✓ Proveedor actualizado correctamente', 'success');
  } else {
    guardarProveedor(proveedor);
    mostrarToast('✓ Proveedor agregado correctamente', 'success');
  }

  cerrarModal('modal-proveedor');
  pintarTabla();
}

function _confirmarEliminar(id) {
  const proveedor = obtenerProveedores().find((p) => p.id === id);
  confirmarAccion({
    titulo: 'Eliminar proveedor',
    mensaje: `¿Deseas eliminar a "${proveedor?.empresa}"? Esta acción no se puede deshacer.`,
    onConfirmar: () => {
      eliminarProveedor(id);
      mostrarToast('Proveedor eliminado', 'info');
      pintarTabla();
    },
  });
}

function _verProductos(id) {
  const proveedor = obtenerProveedores().find((p) => p.id === id);
  if (!proveedor) return;
  const productos = obtenerProductos().filter((p) => p.proveedorId === id);

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
                <td class="cell-strong">${escaparHTML(p.imagen)} ${escaparHTML(p.nombre)}</td>
                <td class="cell-mono">${formatearMoneda(p.precioCompra)}</td>
                <td class="cell-mono">${formatearCantidadUnidad(p.stock, p.unidad)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
  }

  abrirModal('modal-productos-proveedor');
}
