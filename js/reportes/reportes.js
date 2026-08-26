/* ==========================================================================
   reportes.js — página de reportes y estadísticas (pages/reportes.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  Layout.inicializarLayout({ activo: 'reportes', titulo: 'Reportes', subtitulo: 'Estadísticas del negocio', dentroDePages: true });
  Modales.inicializarModalConfirmar();
  Helpers.inicializarCierreModales();

  const ventas = Storage.obtenerVentas();
  const productos = Storage.obtenerProductos();

  pintarResumen(ventas, productos);
  pintarTopProductos(ventas);
  pintarGraficoVentas(ventas);
  pintarGraficoTopProductos(ventas);
});

function _enRango(fechaISO, dias) {
  const fecha = new Date(fechaISO);
  const limite = new Date();
  limite.setDate(limite.getDate() - dias);
  return fecha >= limite;
}

function pintarResumen(ventas, productos) {
  const ventasHoy = ventas.filter((v) => new Date(v.fecha).toDateString() === new Date().toDateString());
  const ventasSemana = ventas.filter((v) => _enRango(v.fecha, 7));
  const ventasMes = ventas.filter((v) => _enRango(v.fecha, 30));

  const totalIngresos = ventas.reduce((acc, v) => acc + v.total, 0);
  const totalCostos = ventas.reduce((acc, v) => acc + v.items.reduce((a, i) => {
    const p = productos.find((pr) => pr.id === i.productoId);
    return a + (p ? p.precioCompra * i.cantidad : 0);
  }, 0), 0);
  const gananciaEstimada = totalIngresos - totalCostos;

  const tarjetas = [
    { label: 'Ventas del día', valor: Formatters.formatearMoneda(ventasHoy.reduce((a, v) => a + v.total, 0)), icono: '📅' },
    { label: 'Ventas de la semana', valor: Formatters.formatearMoneda(ventasSemana.reduce((a, v) => a + v.total, 0)), icono: '🗓️' },
    { label: 'Ventas del mes', valor: Formatters.formatearMoneda(ventasMes.reduce((a, v) => a + v.total, 0)), icono: '📆' },
    { label: 'Total de ingresos', valor: Formatters.formatearMoneda(totalIngresos), icono: '💰' },
    { label: 'Total de costos', valor: Formatters.formatearMoneda(totalCostos), icono: '🧮' },
    { label: 'Ganancia estimada', valor: Formatters.formatearMoneda(gananciaEstimada), icono: '📈' },
  ];

  document.getElementById('reportes-stat-grid').innerHTML = tarjetas.map((t) => `
    <div class="stat-card">
      <span class="stat-card__icon">${t.icono}</span>
      <div class="stat-card__label">${t.label}</div>
      <div class="stat-card__value mono" style="font-size:1.4rem;">${t.valor}</div>
    </div>
  `).join('');
}

function _calcularVentasPorProducto(ventas) {
  const mapa = {};
  ventas.forEach((v) => {
    v.items.forEach((i) => {
      if (!mapa[i.productoId]) mapa[i.productoId] = { nombre: i.nombre, cantidad: 0, ingresos: 0, unidad: i.unidad };
      mapa[i.productoId].cantidad += i.cantidad;
      mapa[i.productoId].ingresos += i.subtotal;
    });
  });
  return Object.values(mapa);
}

function pintarTopProductos(ventas) {
  const productos = Storage.obtenerProductos();
  const ventasPorProducto = _calcularVentasPorProducto(ventas).sort((a, b) => b.cantidad - a.cantidad);

  const masVendido = ventasPorProducto[0];
  const menosVendido = ventasPorProducto[ventasPorProducto.length - 1];

  const gananciaPorProducto = ventasPorProducto.map((vp) => {
    const producto = productos.find((p) => p.nombre === vp.nombre);
    const costoTotal = producto ? producto.precioCompra * vp.cantidad : 0;
    return { ...vp, ganancia: vp.ingresos - costoTotal };
  }).sort((a, b) => b.ganancia - a.ganancia);

  document.getElementById('resumen-productos').innerHTML = `
    <div class="alert alert-info mb-2">🏆 Producto más vendido: <strong>${Helpers.escaparHTML(masVendido?.nombre || '—')}</strong> (${masVendido ? Formatters.formatearCantidadUnidad(masVendido.cantidad, masVendido.unidad) : '—'})</div>
    <div class="alert alert-warning">📉 Producto menos vendido: <strong>${Helpers.escaparHTML(menosVendido?.nombre || '—')}</strong> (${menosVendido ? Formatters.formatearCantidadUnidad(menosVendido.cantidad, menosVendido.unidad) : '—'})</div>
  `;

  const tbody = document.getElementById('tabla-ganancia-productos');
  tbody.innerHTML = gananciaPorProducto.slice(0, 8).map((p) => `
    <tr>
      <td class="cell-strong">${Helpers.escaparHTML(p.nombre)}</td>
      <td class="cell-mono">${Formatters.formatearCantidadUnidad(p.cantidad, p.unidad)}</td>
      <td class="cell-mono">${Formatters.formatearMoneda(p.ingresos)}</td>
      <td class="cell-mono cell-strong" style="color:var(--success-color);">${Formatters.formatearMoneda(p.ganancia)}</td>
    </tr>
  `).join('') || `<tr><td colspan="4"><div class="empty-state"><div class="empty-state__title">No hay datos suficientes</div></div></td></tr>`;
}

function pintarGraficoVentas(ventas) {
  const dias = [];
  const totalesPorDia = [];
  for (let i = 13; i >= 0; i--) {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() - i);
    const etiqueta = fecha.toLocaleDateString('es-DO', { day: '2-digit', month: '2-digit' });
    const total = ventas
      .filter((v) => new Date(v.fecha).toDateString() === fecha.toDateString())
      .reduce((acc, v) => acc + v.total, 0);
    dias.push(etiqueta);
    totalesPorDia.push(Math.round(total));
  }

  const ctx = document.getElementById('grafico-ventas');
  // eslint-disable-next-line no-undef
  new Chart(ctx, {
    type: 'line',
    data: {
      labels: dias,
      datasets: [{
        label: 'Ventas diarias (RD$)',
        data: totalesPorDia,
        borderColor: '#e4633f',
        backgroundColor: 'rgba(228, 99, 63, 0.12)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#0f5c73',
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}

function pintarGraficoTopProductos(ventas) {
  const top = _calcularVentasPorProducto(ventas).sort((a, b) => b.cantidad - a.cantidad).slice(0, 6);

  const ctx = document.getElementById('grafico-top-productos');
  // eslint-disable-next-line no-undef
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: top.map((p) => p.nombre),
      datasets: [{
        label: 'Unidades vendidas',
        data: top.map((p) => Math.round(p.cantidad * 100) / 100),
        backgroundColor: '#0f5c73',
        borderRadius: 6,
      }],
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
    },
  });
}
