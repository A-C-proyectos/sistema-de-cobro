/* ==========================================================================
   productos.js — página de gestión de productos (pages/productos.html)
   ========================================================================== */

import { inicializarLayout } from '../components/layout.js';
import { inicializarModalConfirmar } from '../components/modales.js';
import {
  obtenerProductos,
  obtenerProveedores,
  guardarProducto,
  actualizarProducto,
  eliminarProducto,
} from '../utils/storage.js';
import { validarProducto, aplicarErroresFormulario } from '../utils/validators.js';
import { formatearMoneda, formatearCantidadUnidad, etiquetaUnidad } from '../utils/formatters.js';
import { mostrarToast, abrirModal, cerrarModal, confirmarAccion, escaparHTML, debounce, inicializarCierreModales } from '../utils/helpers.js';

const CATEGORIAS = ['Pescados', 'Mariscos', 'Camarones', 'Pulpo', 'Calamar', 'Cangrejo', 'Filetes', 'Pescado congelado', 'Productos preparados', 'Otros'];
const EMOJIS = ['🐟', '🦐', '🦑', '🦀', '🦞', '🐙', '🍣'];

let filtroTexto = '';
let filtroCategoria = 'todas';
let ordenColumna = null;
let ordenAsc = true;
let editandoId = null;

document.addEventListener('DOMContentLoaded', () => {
  inicializarLayout({ activo: 'productos', titulo: 'Productos', subtitulo: 'Catálogo maestro de productos', dentroDePages: true });
  inicializarModalConfirmar();
  inicializarCierreModales();

  _poblarSelects();
  pintarTabla();

  document.getElementById('buscar').addEventListener('input', debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarTabla();
  }, 200));

  document.getElementById('filtro-categoria').addEventListener('change', (e) => {
    filtroCategoria = e.target.value;
    pintarTabla();
  });

  document.getElementById('btn-nuevo-producto').addEventListener('click', () => _abrirFormulario());
  document.getElementById('form-producto').addEventListener('submit', _guardarFormulario);

  document.querySelectorAll('.data-table thead th[data-sort]').forEach((th) => {
    th.addEventListener('click', () => {
      const col = th.dataset.sort;
      ordenAsc = ordenColumna === col ? !ordenAsc : true;
      ordenColumna = col;
      pintarTabla();
    });
  });
});

function _poblarSelects() {
  const selCategoria = document.getElementById('filtro-categoria');
  selCategoria.innerHTML = `<option value="todas">Todas las categorías</option>` +
    CATEGORIAS.map((c) => `<option value="${c}">${c}</option>`).join('');

  const selCategoriaForm = document.getElementById('campo-categoria');
  selCategoriaForm.innerHTML = CATEGORIAS.map((c) => `<option value="${c}">${c}</option>`).join('');

  const proveedores = obtenerProveedores();
  const selProveedor = document.getElementById('campo-proveedorId');
  selProveedor.innerHTML = `<option value="">Sin proveedor asignado</option>` +
    proveedores.map((p) => `<option value="${p.id}">${escaparHTML(p.empresa)}</option>`).join('');

  const selEmoji = document.getElementById('campo-imagen');
  selEmoji.innerHTML = EMOJIS.map((e) => `<option value="${e}">${e}</option>`).join('');
}

function pintarTabla() {
  let productos = obtenerProductos().filter((p) => {
    const coincideTexto = !filtroTexto || p.nombre.toLowerCase().includes(filtroTexto) || p.sku.toLowerCase().includes(filtroTexto);
    const coincideCategoria = filtroCategoria === 'todas' || p.categoria === filtroCategoria;
    return coincideTexto && coincideCategoria;
  });

  if (ordenColumna) {
    productos = [...productos].sort((a, b) => {
      const valA = a[ordenColumna];
      const valB = b[ordenColumna];
      const cmp = typeof valA === 'number' ? valA - valB : String(valA).localeCompare(String(valB));
      return ordenAsc ? cmp : -cmp;
    });
  }

  document.querySelectorAll('.data-table thead th[data-sort]').forEach((th) => {
    th.classList.toggle('sorted', th.dataset.sort === ordenColumna);
    th.querySelector('.sort-arrow').textContent = th.dataset.sort === ordenColumna ? (ordenAsc ? '▲' : '▼') : '↕';
  });

  const proveedores = obtenerProveedores();
  const tbody = document.getElementById('tabla-productos');

  if (productos.length === 0) {
    tbody.innerHTML = `<tr><td colspan="9"><div class="empty-state"><div class="empty-state__icon">🐟</div><div class="empty-state__title">No se encontraron productos</div><p>Ajusta la búsqueda o agrega un nuevo producto.</p></div></td></tr>`;
    return;
  }

  tbody.innerHTML = productos.map((p) => {
    const proveedor = proveedores.find((pr) => pr.id === p.proveedorId);
    const estadoBadge = p.estado === 'activo'
      ? '<span class="badge badge-success">Activo</span>'
      : '<span class="badge badge-neutral">Inactivo</span>';
    return `
      <tr>
        <td style="font-size:1.4rem;">${escaparHTML(p.imagen)}</td>
        <td class="cell-strong">${escaparHTML(p.nombre)}<div class="cell-muted" style="font-size:11px;">${escaparHTML(p.sku)}</div></td>
        <td>${escaparHTML(p.categoria)}</td>
        <td class="cell-muted">${escaparHTML(proveedor ? proveedor.empresa : '—')}</td>
        <td>${etiquetaUnidad(p.unidad)}</td>
        <td class="cell-mono">${formatearMoneda(p.precioCompra)}</td>
        <td class="cell-mono cell-strong">${formatearMoneda(p.precioVenta)}</td>
        <td class="cell-mono">${formatearCantidadUnidad(p.stock, p.unidad)}</td>
        <td>${estadoBadge}</td>
        <td class="cell-actions">
          <button class="btn btn-outline btn-sm btn-editar" data-id="${p.id}">Editar</button>
          <button class="btn btn-danger btn-sm btn-eliminar" data-id="${p.id}">Eliminar</button>
        </td>
      </tr>
    `;
  }).join('');

  tbody.querySelectorAll('.btn-editar').forEach((b) => b.addEventListener('click', () => _abrirFormulario(b.dataset.id)));
  tbody.querySelectorAll('.btn-eliminar').forEach((b) => b.addEventListener('click', () => _confirmarEliminar(b.dataset.id)));
}

function _abrirFormulario(id = null) {
  editandoId = id;
  const form = document.getElementById('form-producto');
  form.reset();
  aplicarErroresFormulario({});

  document.getElementById('titulo-modal-producto').textContent = id ? 'Editar producto' : 'Nuevo producto';

  if (id) {
    const producto = obtenerProductos().find((p) => p.id === id);
    if (!producto) return;
    Object.entries(producto).forEach(([campo, valor]) => {
      const input = document.getElementById(`campo-${campo}`);
      if (input) input.value = valor;
    });
  } else {
    document.getElementById('campo-estado').value = 'activo';
    document.getElementById('campo-imagen').value = '🐟';
  }

  abrirModal('modal-producto');
}

function _guardarFormulario(e) {
  e.preventDefault();

  const producto = {
    nombre: document.getElementById('campo-nombre').value.trim(),
    descripcion: document.getElementById('campo-descripcion').value.trim(),
    categoria: document.getElementById('campo-categoria').value,
    proveedorId: document.getElementById('campo-proveedorId').value,
    unidad: document.getElementById('campo-unidad').value,
    precioCompra: Number(document.getElementById('campo-precioCompra').value),
    precioVenta: Number(document.getElementById('campo-precioVenta').value),
    stock: Number(document.getElementById('campo-stock').value),
    stockMinimo: Number(document.getElementById('campo-stockMinimo').value),
    sku: document.getElementById('campo-sku').value.trim() || `SKU-${Date.now().toString().slice(-6)}`,
    imagen: document.getElementById('campo-imagen').value,
    estado: document.getElementById('campo-estado').value,
  };

  const { valido, errores } = validarProducto(producto);
  if (!valido) {
    aplicarErroresFormulario(errores);
    return;
  }

  if (editandoId) {
    actualizarProducto(editandoId, producto);
    mostrarToast('✓ Producto actualizado correctamente', 'success');
  } else {
    guardarProducto(producto);
    mostrarToast('✓ Producto agregado correctamente', 'success');
  }

  cerrarModal('modal-producto');
  pintarTabla();
}

function _confirmarEliminar(id) {
  const producto = obtenerProductos().find((p) => p.id === id);
  confirmarAccion({
    titulo: 'Eliminar producto',
    mensaje: `¿Deseas eliminar "${producto?.nombre}"? Esta acción no se puede deshacer.`,
    textoConfirmar: 'Eliminar',
    onConfirmar: () => {
      eliminarProducto(id);
      mostrarToast('Producto eliminado', 'info');
      pintarTabla();
    },
  });
}
