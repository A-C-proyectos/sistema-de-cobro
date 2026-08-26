/* ==========================================================================
   checkout.js — modal de cobro, cálculo de cambio, registro de venta y recibo
   ========================================================================== */

let metodoSeleccionado = 'efectivo';
let onVentaCompletada = () => {};
let ventaActualParaRecibo = null;

function inicializarCheckout({ alCompletarVenta }) {
  onVentaCompletada = alCompletarVenta || (() => {});

  document.querySelectorAll('.payment-method').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.payment-method').forEach((b) => b.classList.remove('is-selected'));
      btn.classList.add('is-selected');
      metodoSeleccionado = btn.dataset.metodo;
      document.getElementById('bloque-efectivo').classList.toggle('hidden', metodoSeleccionado !== 'efectivo');
      _recalcularCambio();
    });
  });

  document.getElementById('input-efectivo-recibido')?.addEventListener('input', _recalcularCambio);
  document.getElementById('btn-confirmar-pago')?.addEventListener('click', _confirmarVenta);
  document.getElementById('btn-nueva-venta')?.addEventListener('click', () => {
    Helpers.cerrarModal('modal-recibo');
  });
  document.getElementById('btn-imprimir-recibo')?.addEventListener('click', () => window.print());
  document.getElementById('btn-descargar-recibo')?.addEventListener('click', () => {
    if (!ventaActualParaRecibo) return;
    const nombreArchivo = `factura-${ventaActualParaRecibo.numero}.txt`;
    const cliente = ventaActualParaRecibo.clienteId ? Storage.obtenerClientePorId(ventaActualParaRecibo.clienteId) : null;
    const texto = Formatters.construirTextoRecibo(ventaActualParaRecibo, Storage.obtenerConfig(), cliente);
    Helpers.descargarArchivo(nombreArchivo, texto, 'text/plain');
    Helpers.mostrarToast(`✓ Factura descargada: ${nombreArchivo}`, 'success');
  });
}

function abrirCheckout() {
  if (Carrito.carritoVacio()) {
    Helpers.mostrarToast('Agrega al menos un producto al carrito antes de cobrar.', 'warning');
    return;
  }

  metodoSeleccionado = 'efectivo';
  document.querySelectorAll('.payment-method').forEach((b, i) => b.classList.toggle('is-selected', i === 0));
  document.getElementById('bloque-efectivo').classList.remove('hidden');

  const totales = Carrito.calcularTotales();
  document.getElementById('checkout-total-valor').textContent = Formatters.formatearMoneda(totales.total);
  const inputEfectivo = document.getElementById('input-efectivo-recibido');
  inputEfectivo.value = '';
  document.getElementById('checkout-cambio').classList.add('hidden');

  Helpers.abrirModal('modal-checkout');
  setTimeout(() => inputEfectivo.focus(), 150);
}

function _recalcularCambio() {
  const totales = Carrito.calcularTotales();
  const cambioEl = document.getElementById('checkout-cambio');
  const btnConfirmar = document.getElementById('btn-confirmar-pago');

  if (metodoSeleccionado !== 'efectivo') {
    cambioEl.classList.add('hidden');
    btnConfirmar.disabled = false;
    return;
  }

  const recibido = Number(document.getElementById('input-efectivo-recibido').value) || 0;
  cambioEl.classList.remove('hidden');

  if (!Validators.validarEfectivoSuficiente(totales.total, recibido)) {
    cambioEl.classList.add('is-invalid');
    cambioEl.innerHTML = `<span>Falta por cubrir</span><span>${Formatters.formatearMoneda(totales.total - recibido)}</span>`;
    btnConfirmar.disabled = true;
  } else {
    cambioEl.classList.remove('is-invalid');
    const cambio = Math.round((recibido - totales.total) * 100) / 100;
    cambioEl.innerHTML = `<span>Cambio a entregar</span><span>${Formatters.formatearMoneda(cambio)}</span>`;
    btnConfirmar.disabled = false;
  }
}

function _confirmarVenta() {
  const items = Carrito.obtenerItems();

  // Revalidar stock disponible justo antes de confirmar (por si cambió).
  for (const item of items) {
    const producto = Storage.obtenerProductoPorId(item.productoId);
    if (!producto) continue;
    const check = Validators.validarStockDisponible(producto.stock, item.cantidad);
    if (!check.valido) {
      Helpers.mostrarToast(`${producto.nombre}: ${check.mensaje}`, 'danger', 4500);
      return;
    }
  }

  const totales = Carrito.calcularTotales();
  const recibido = metodoSeleccionado === 'efectivo'
    ? Number(document.getElementById('input-efectivo-recibido').value) || 0
    : totales.total;

  if (metodoSeleccionado === 'efectivo' && !Validators.validarEfectivoSuficiente(totales.total, recibido)) {
    Helpers.mostrarToast('El efectivo recibido es menor que el total. No se puede finalizar la venta.', 'danger');
    return;
  }

  const config = Storage.obtenerConfig();
  const cambio = metodoSeleccionado === 'efectivo' ? Math.round((recibido - totales.total) * 100) / 100 : 0;

  const venta = Storage.guardarVenta({
    clienteId: Carrito.obtenerCliente(),
    empleado: config.empleadoActual,
    metodoPago: metodoSeleccionado,
    items: items.map((i) => ({
      productoId: i.productoId,
      nombre: i.nombre,
      cantidad: i.cantidad,
      unidad: i.unidad,
      precioUnitario: i.precioUnitario,
      subtotal: Math.round(i.precioUnitario * i.cantidad * 100) / 100,
    })),
    subtotal: totales.subtotal,
    descuento: totales.descuento,
    impuesto: totales.impuesto,
    total: totales.total,
    efectivoRecibido: recibido,
    cambio,
    estado: 'completada',
  });

  // Reducir inventario y registrar movimientos de salida.
  items.forEach((item) => {
    Storage.ajustarStockProducto(item.productoId, -item.cantidad);
    Storage.guardarMovimiento({
      productoId: item.productoId,
      productoNombre: item.nombre,
      cantidad: item.cantidad,
      unidad: item.unidad,
      tipo: 'salida',
      motivo: `Venta #${venta.numero}`,
      usuario: config.empleadoActual,
    });
  });

  Helpers.cerrarModal('modal-checkout');
  Helpers.mostrarToast(`Venta #${venta.numero} registrada correctamente`, 'success');
  _mostrarRecibo(venta);

  Carrito.vaciarCarrito();
  onVentaCompletada();
}

function _mostrarRecibo(venta) {
  ventaActualParaRecibo = venta;
  const config = Storage.obtenerConfig();
  const cliente = venta.clienteId ? Storage.obtenerClientePorId(venta.clienteId) : null;

  const filasProductos = venta.items.map((i) => `
    <tr>
      <td>${Helpers.escaparHTML(i.nombre)}</td>
      <td style="text-align:center;">${Formatters.formatearCantidadUnidad(i.cantidad, i.unidad)}</td>
      <td style="text-align:right;">${Formatters.formatearMoneda(i.subtotal)}</td>
    </tr>
  `).join('');

  document.getElementById('recibo-contenido').innerHTML = `
    <div class="receipt-title receipt__center">${Helpers.escaparHTML(config.nombreNegocio.toUpperCase())}</div>
    <div class="receipt__center">================================</div>
    <div class="mt-2 receipt__center">Venta #${Helpers.escaparHTML(venta.numero)}</div>
    <hr>
    <div class="receipt-row"><span>Fecha:</span><span>${Formatters.formatearFechaHora(venta.fecha)}</span></div>
    <div class="receipt-row"><span>Cliente:</span><span>${Helpers.escaparHTML(cliente ? cliente.nombre : 'Cliente ocasional')}</span></div>
    <div class="receipt-row"><span>Cajero:</span><span>${Helpers.escaparHTML(venta.empleado)}</span></div>
    <hr>
    <table>
      <thead><tr><td>Producto</td><td style="text-align:center;">Cant.</td><td style="text-align:right;">Total</td></tr></thead>
      <tbody>${filasProductos}</tbody>
    </table>
    <hr>
    <div class="receipt-row"><span>Subtotal:</span><span>${Formatters.formatearMoneda(venta.subtotal)}</span></div>
    <div class="receipt-row"><span>Descuento:</span><span>${Formatters.formatearMoneda(venta.descuento)}</span></div>
    <div class="receipt-row"><span>Impuesto:</span><span>${Formatters.formatearMoneda(venta.impuesto)}</span></div>
    <div class="receipt-row" style="font-weight:700; font-size:14px;"><span>TOTAL:</span><span>${Formatters.formatearMoneda(venta.total)}</span></div>
    <hr>
    <div class="receipt-row"><span>Método de pago:</span><span>${Formatters.etiquetaMetodoPago(venta.metodoPago)}</span></div>
    ${venta.metodoPago === 'efectivo' ? `
      <div class="receipt-row"><span>Recibido:</span><span>${Formatters.formatearMoneda(venta.efectivoRecibido)}</span></div>
      <div class="receipt-row"><span>Cambio:</span><span>${Formatters.formatearMoneda(venta.cambio)}</span></div>
    ` : ''}
    <div class="receipt__center mt-2">================================</div>
    <div class="receipt__center">¡Gracias por su compra!</div>
  `;

  Helpers.abrirModal('modal-recibo');
}

window.Checkout = { inicializarCheckout, abrirCheckout };
