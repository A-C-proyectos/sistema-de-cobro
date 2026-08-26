/* ==========================================================================
   validators.js — validaciones de formularios y reglas de negocio
   ========================================================================== */

function esTextoValido(texto, minLen = 1) {
  return typeof texto === 'string' && texto.trim().length >= minLen;
}

function esNumeroPositivo(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n > 0;
}

function esNumeroNoNegativo(valor) {
  const n = Number(valor);
  return Number.isFinite(n) && n >= 0;
}

function esCorreoValido(correo) {
  if (!correo) return true; // correo es opcional en varios formularios
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo);
}

function esTelefonoValido(telefono) {
  if (!telefono) return true;
  return /^[0-9()+\-\s]{7,}$/.test(telefono);
}

/**
 * Valida un producto antes de guardarlo/actualizarlo.
 * Devuelve un objeto { valido, errores } donde errores es { campo: mensaje }.
 */
function validarProducto(producto) {
  const errores = {};
  if (!esTextoValido(producto.nombre)) errores.nombre = 'El nombre del producto es obligatorio.';
  if (!esTextoValido(producto.categoria)) errores.categoria = 'Selecciona una categoría.';
  if (!esTextoValido(producto.unidad)) errores.unidad = 'Selecciona una unidad de medida.';
  if (!esNumeroPositivo(producto.precioVenta)) errores.precioVenta = 'El precio de venta debe ser mayor que cero.';
  if (!esNumeroNoNegativo(producto.precioCompra)) errores.precioCompra = 'El precio de compra no puede ser negativo.';
  if (!esNumeroNoNegativo(producto.stock)) errores.stock = 'El stock no puede ser negativo.';
  if (!esNumeroNoNegativo(producto.stockMinimo)) errores.stockMinimo = 'El stock mínimo no puede ser negativo.';
  return { valido: Object.keys(errores).length === 0, errores };
}

function validarCliente(cliente) {
  const errores = {};
  if (!esTextoValido(cliente.nombre)) errores.nombre = 'El nombre del cliente es obligatorio.';
  if (!esCorreoValido(cliente.correo)) errores.correo = 'El correo no tiene un formato válido.';
  if (!esTelefonoValido(cliente.telefono)) errores.telefono = 'El teléfono no tiene un formato válido.';
  return { valido: Object.keys(errores).length === 0, errores };
}

function validarProveedor(proveedor) {
  const errores = {};
  if (!esTextoValido(proveedor.empresa)) errores.empresa = 'El nombre de la empresa es obligatorio.';
  if (!esTextoValido(proveedor.contacto)) errores.contacto = 'El nombre de contacto es obligatorio.';
  if (!esCorreoValido(proveedor.correo)) errores.correo = 'El correo no tiene un formato válido.';
  if (!esTelefonoValido(proveedor.telefono)) errores.telefono = 'El teléfono no tiene un formato válido.';
  return { valido: Object.keys(errores).length === 0, errores };
}

function validarMovimiento(movimiento) {
  const errores = {};
  if (!esTextoValido(movimiento.productoId)) errores.productoId = 'Selecciona un producto.';
  if (!esNumeroPositivo(movimiento.cantidad)) errores.cantidad = 'La cantidad debe ser mayor que cero.';
  if (!esTextoValido(movimiento.tipo)) errores.tipo = 'Selecciona el tipo de movimiento.';
  if (!esTextoValido(movimiento.motivo)) errores.motivo = 'Indica el motivo del movimiento.';
  return { valido: Object.keys(errores).length === 0, errores };
}

/**
 * Verifica que haya stock suficiente para vender/retirar una cantidad.
 */
function validarStockDisponible(stockActual, cantidadSolicitada) {
  if (cantidadSolicitada > stockActual) {
    return {
      valido: false,
      mensaje: `Stock insuficiente. Disponible: ${stockActual}. Solicitado: ${cantidadSolicitada}.`,
    };
  }
  return { valido: true, mensaje: '' };
}

function validarEfectivoSuficiente(total, efectivoRecibido) {
  return Number(efectivoRecibido) >= Number(total);
}

/**
 * Aplica los mensajes de error de `errores` a los campos del formulario.
 * Espera que cada campo tenga un input con id "campo-<nombre>" y un
 * elemento .field-error con id "error-<nombre>".
 */
function aplicarErroresFormulario(errores, prefijo = '') {
  document.querySelectorAll(`[id^="${prefijo}error-"]`).forEach((el) => {
    el.textContent = '';
    el.classList.remove('show');
  });
  document.querySelectorAll(`[id^="${prefijo}campo-"]`).forEach((el) => {
    el.classList.remove('has-error');
  });

  Object.entries(errores).forEach(([campo, mensaje]) => {
    const errorEl = document.getElementById(`${prefijo}error-${campo}`);
    const inputEl = document.getElementById(`${prefijo}campo-${campo}`);
    if (errorEl) {
      errorEl.textContent = mensaje;
      errorEl.classList.add('show');
    }
    if (inputEl) inputEl.classList.add('has-error');
  });
}

window.Validators = {
  esTextoValido,
  esNumeroPositivo,
  esNumeroNoNegativo,
  esCorreoValido,
  esTelefonoValido,
  validarProducto,
  validarCliente,
  validarProveedor,
  validarMovimiento,
  validarStockDisponible,
  validarEfectivoSuficiente,
  aplicarErroresFormulario,
};
