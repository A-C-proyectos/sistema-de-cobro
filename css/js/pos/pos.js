/* ==========================================================================
   pos.js — pantalla de Punto de Venta (pos.html)
   ========================================================================== */

let filtroTexto = '';
let filtroCategoria = 'todas';

document.addEventListener('DOMContentLoaded', () => {
  Layout.inicializarLayout({ activo: 'pos', titulo: 'Punto de venta', subtitulo: 'Selecciona productos y cobra', dentroDePages: true });
  Modales.inicializarModalConfirmar();
  Helpers.inicializarCierreModales();

  const config = Storage.obtenerConfig();
  Carrito.establecerImpuesto(config.impuestoPorcentaje || 0);

  pintarCategorias();
  pintarCatalogo();
  pintarClientes();
  pintarCarrito();

  document.getElementById('buscar-producto').addEventListener('input', Helpers.debounce((e) => {
    filtroTexto = e.target.value.trim().toLowerCase();
    pintarCatalogo();
  }, 200));

  document.getElementById('select-cliente').addEventListener('change', (e) => {
    Carrito.establecerCliente(e.target.value);
  });

  document.getElementById('input-descuento').addEventListener('input', (e) => {
    Carrito.establecerDescuento(e.target.value);
    pintarTotales();
  });

  document.getElementById('btn-vaciar-carrito').addEventListener('click', () => {
    Carrito.vaciarCarrito();
    document.getElementById('select-cliente').value = '';
    document.getElementById('input-descuento').value = '';
    pintarCarrito();
    Helpers.mostrarToast('Carrito vaciado', 'info');
  });

  document.getElementById('btn-cobrar').addEventListener('click', Checkout.abrirCheckout);

  Checkout.inicializarCheckout({
    alCompletarVenta: () => {
      pintarCatalogo();
      pintarCarrito();
      document.getElementById('select-cliente').value = '';
      document.getElementById('input-descuento').value = '';
    },
  });
});

/* ---------------------------------------------------------------------- */
/* Catálogo                                                                */
/* ---------------------------------------------------------------------- */

function pintarCategorias() {
  const productos = Storage.obtenerProductos();
  const categorias = ['todas', ...new Set(productos.map((p) => p.categoria))];
  const cont = document.getElementById('filtro-categorias');
  cont.innerHTML = categorias.map((cat) => `
    <button class="chip ${cat === filtroCategoria ? 'is-active' : ''}" data-cat="${Helpers.escaparHTML(cat)}">
      ${cat === 'todas' ? 'Todas' : Helpers.escaparHTML(cat)}
    </button>
  `).join('');

  cont.querySelectorAll('.chip').forEach((chip) => {
    chip.addEventListener('click', () => {
      filtroCategoria = chip.dataset.cat;
      pintarCategorias();
      pintarCatalogo();
    });
  });
}

function pintarCatalogo() {
  const productos = Storage.obtenerProductos().filter((p) => {
    const coincideTexto = !filtroTexto || p.nombre.toLowerCase().includes(filtroTexto) || p.sku.toLowerCase().includes(filtroTexto);
    const coincideCategoria = filtroCategoria === 'todas' || p.categoria === filtroCategoria;
    return coincideTexto && coincideCategoria && p.estado === 'activo';
  });

  const grid = document.getElementById('pos-grid');

  if (productos.length === 0) {
    grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-state__icon">🔍</div><div class="empty-state__title">No se encontraron productos</div><p>Prueba con otra búsqueda o categoría.</p></div>`;
    return;
  }

  grid.innerHTML = productos.map((p) => {
    const agotado = p.stock <= 0;
    let claseStock = '';
    if (agotado) claseStock = 'is-out';
    else if (p.stock <= p.stockMinimo) claseStock = 'is-low';

    return `
      <button class="product-card ${agotado ? 'is-disabled' : ''}" data-id="${p.id}" ${agotado ? 'disabled' : ''}>
        <div class="product-card__img">${Helpers.esImagenDataURL(p.imagen) ? `<img src="${p.imagen}" alt="${Helpers.escaparHTML(p.nombre)}">` : Helpers.escaparHTML(p.imagen || '🐟')}</div>
        <div class="product-card__body">
          <div class="product-card__name">${Helpers.escaparHTML(p.nombre)}</div>
          <div class="product-card__cat">${Helpers.escaparHTML(p.categoria)}</div>
          <div class="product-card__footer">
            <div class="product-card__price">${Formatters.formatearMoneda(p.precioVenta)}<span>/${Formatters.etiquetaUnidad(p.unidad)}</span></div>
            <div class="product-card__stock ${claseStock}">${agotado ? 'Agotado' : Formatters.formatearCantidadUnidad(p.stock, p.unidad)}</div>
          </div>
        </div>
      </button>
    `;
  }).join('');

  grid.querySelectorAll('.product-card:not(.is-disabled)').forEach((card) => {
    card.addEventListener('click', () => _agregarAlCarrito(card.dataset.id));
  });
}

function _agregarAlCarrito(productoId) {
  const producto = Storage.obtenerProductoPorId(productoId);
  if (!producto) return;

  const itemExistente = Carrito.obtenerItems().find((i) => i.productoId === productoId);
  const cantidadDeseada = (itemExistente ? itemExistente.cantidad : 0) + 1;
  const check = Validators.validarStockDisponible(producto.stock, cantidadDeseada);
  if (!check.valido) {
    Helpers.mostrarToast(check.mensaje, 'warning');
    return;
  }

  Carrito.agregarItem(producto, 1);
  Helpers.mostrarToast(`✓ ${producto.nombre} agregado al carrito`, 'success', 1800);
  pintarCarrito();
}

/* ---------------------------------------------------------------------- */
/* Clientes                                                                 */
/* ---------------------------------------------------------------------- */

function pintarClientes() {
  const clientes = Storage.obtenerClientes();
  const select = document.getElementById('select-cliente');
  select.innerHTML = `<option value="">Cliente ocasional</option>` +
    clientes.map((c) => `<option value="${c.id}">${Helpers.escaparHTML(c.nombre)}</option>`).join('');
}

/* ---------------------------------------------------------------------- */
/* Carrito                                                                  */
/* ---------------------------------------------------------------------- */

function pintarCarrito() {
  const items = Carrito.obtenerItems();
  const cont = document.getElementById('lista-carrito');
  const contador = document.getElementById('carrito-contador');
  contador.textContent = items.length;

  if (items.length === 0) {
    cont.innerHTML = `<div class="empty-state"><div class="empty-state__icon">🛒</div><div class="empty-state__title">El carrito está vacío</div><p>Toca un producto para agregarlo.</p></div>`;
  } else {
    const step = (unidad) => (unidad === 'unidad' ? 1 : 0.25);
    cont.innerHTML = items.map((i) => `
      <div class="cart-item" data-id="${i.productoId}">
        <div class="cart-item__name">${Helpers.escaparHTML(i.nombre)}<div class="cart-item__unit">${Formatters.formatearMoneda(i.precioUnitario)} / ${Formatters.etiquetaUnidad(i.unidad)}</div></div>
        <div class="cart-item__subtotal">${Formatters.formatearMoneda(i.precioUnitario * i.cantidad)}</div>
        <div class="cart-item__controls">
          <div class="qty-control">
            <button class="qty-menos" type="button">−</button>
            <input type="number" class="qty-input" value="${i.cantidad}" step="${step(i.unidad)}" min="0">
            <button class="qty-mas" type="button">+</button>
          </div>
          <span class="text-muted" style="font-size:11px;">${Formatters.etiquetaUnidad(i.unidad)}</span>
          <button class="cart-item__remove" type="button">Eliminar</button>
        </div>
      </div>
    `).join('');
  }

  cont.querySelectorAll('.cart-item').forEach((el) => {
    const id = el.dataset.id;
    const item = items.find((i) => i.productoId === id);
    const producto = Storage.obtenerProductoPorId(id);
    const paso = item.unidad === 'unidad' ? 1 : 0.25;

    el.querySelector('.qty-mas').addEventListener('click', () => _cambiarCantidad(id, item.cantidad + paso, producto));
    el.querySelector('.qty-menos').addEventListener('click', () => _cambiarCantidad(id, item.cantidad - paso, producto));
    el.querySelector('.qty-input').addEventListener('change', (e) => _cambiarCantidad(id, Number(e.target.value), producto));
    el.querySelector('.cart-item__remove').addEventListener('click', () => {
      Carrito.eliminarItem(id);
      pintarCarrito();
    });
  });

  pintarTotales();
}

function _cambiarCantidad(productoId, nuevaCantidad, producto) {
  if (nuevaCantidad <= 0) {
    Carrito.eliminarItem(productoId);
    pintarCarrito();
    return;
  }
  if (producto) {
    const check = Validators.validarStockDisponible(producto.stock, nuevaCantidad);
    if (!check.valido) {
      Helpers.mostrarToast(check.mensaje, 'warning');
      pintarCarrito();
      return;
    }
  }
  Carrito.actualizarCantidad(productoId, nuevaCantidad);
  pintarCarrito();
}

function pintarTotales() {
  const t = Carrito.calcularTotales();
  document.getElementById('total-subtotal').textContent = Formatters.formatearMoneda(t.subtotal);
  document.getElementById('total-descuento').textContent = Formatters.formatearMoneda(t.descuento);
  document.getElementById('total-impuesto').textContent = Formatters.formatearMoneda(t.impuesto);
  document.getElementById('total-final').textContent = Formatters.formatearMoneda(t.total);
}
