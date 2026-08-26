/* ==========================================================================
   router.js — configuración de navegación entre páginas
   --------------------------------------------------------------------------
   La aplicación usa páginas HTML reales (no un router SPA), pero centraliza
   aquí la lista de rutas para que el sidebar/topbar compartidos (ver
   js/components/layout.js) se generen desde una única fuente de verdad.
   ========================================================================== */

export const RUTAS = [
  { id: 'dashboard', nombre: 'Dashboard', icono: '📊', href: 'index.html' },
  { id: 'pos', nombre: 'POS / Nueva venta', icono: '🧾', href: 'pages/pos.html' },
  { id: 'inventario', nombre: 'Inventario', icono: '📦', href: 'pages/inventario.html' },
  { id: 'productos', nombre: 'Productos', icono: '🐟', href: 'pages/productos.html' },
  { id: 'clientes', nombre: 'Clientes', icono: '👥', href: 'pages/clientes.html' },
  { id: 'proveedores', nombre: 'Proveedores', icono: '🚚', href: 'pages/proveedores.html' },
  { id: 'ventas', nombre: 'Ventas', icono: '💰', href: 'pages/ventas.html' },
  { id: 'reportes', nombre: 'Reportes', icono: '📈', href: 'pages/reportes.html' },
  { id: 'configuracion', nombre: 'Configuración', icono: '⚙️', href: 'pages/configuracion.html' },
];

/**
 * Calcula la ruta relativa correcta hacia `href` según si la página actual
 * está en la raíz del proyecto o dentro de /pages/.
 */
export function resolverHref(href, dentroDePages) {
  if (!dentroDePages) return href;
  if (href === 'index.html') return '../index.html';
  return href.replace('pages/', '');
}
