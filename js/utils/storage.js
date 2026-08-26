/* ==========================================================================
   storage.js — Capa de persistencia (localStorage)
   --------------------------------------------------------------------------
   Toda la lógica de acceso a datos vive aquí. El resto de la aplicación
   nunca debe llamar a localStorage directamente: siempre pasa por las
   funciones exportadas en este archivo. Esto permite, en el futuro,
   sustituir localStorage por llamadas fetch() a una API REST sin tener
   que tocar el resto del código (ver services más abajo).
   ========================================================================== */

// descargarArchivo se toma de window.Helpers (helpers.js debe cargarse antes que storage.js)

const DB_PREFIX = 'pescaderia_';
const KEYS = {
  PRODUCTOS: `${DB_PREFIX}productos`,
  CLIENTES: `${DB_PREFIX}clientes`,
  PROVEEDORES: `${DB_PREFIX}proveedores`,
  VENTAS: `${DB_PREFIX}ventas`,
  MOVIMIENTOS: `${DB_PREFIX}movimientos`,
  CONFIG: `${DB_PREFIX}config`,
  SEED_VERSION: `${DB_PREFIX}seed_version`,
};

const SEED_VERSION = '1';

/* ---------------------------------------------------------------------- */
/* Núcleo genérico de lectura/escritura                                   */
/* ---------------------------------------------------------------------- */

function _leer(key, porDefecto = []) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : porDefecto;
  } catch (err) {
    console.error(`Error leyendo ${key} de localStorage`, err);
    return porDefecto;
  }
}

function _escribir(key, valor) {
  try {
    localStorage.setItem(key, JSON.stringify(valor));
    return true;
  } catch (err) {
    console.error(`Error escribiendo ${key} en localStorage`, err);
    return false;
  }
}

function _generarId(prefijo, lista) {
  const max = lista.reduce((acc, item) => {
    const n = parseInt(String(item.id).replace(prefijo, ''), 10);
    return Number.isFinite(n) && n > acc ? n : acc;
  }, 0);
  return `${prefijo}${String(max + 1).padStart(4, '0')}`;
}

/* ---------------------------------------------------------------------- */
/* PRODUCTOS                                                              */
/* ---------------------------------------------------------------------- */

function obtenerProductos() {
  return _leer(KEYS.PRODUCTOS);
}

function obtenerProductoPorId(id) {
  return obtenerProductos().find((p) => p.id === id) || null;
}

function guardarProducto(producto) {
  const productos = obtenerProductos();
  const nuevo = { ...producto, id: producto.id || _generarId('PRD', productos) };
  productos.push(nuevo);
  _escribir(KEYS.PRODUCTOS, productos);
  return nuevo;
}

function actualizarProducto(id, cambios) {
  const productos = obtenerProductos();
  const idx = productos.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  productos[idx] = { ...productos[idx], ...cambios };
  _escribir(KEYS.PRODUCTOS, productos);
  return productos[idx];
}

function eliminarProducto(id) {
  const productos = obtenerProductos().filter((p) => p.id !== id);
  return _escribir(KEYS.PRODUCTOS, productos);
}

function ajustarStockProducto(id, delta) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return null;
  const nuevoStock = Math.max(0, Math.round((producto.stock + delta) * 1000) / 1000);
  return actualizarProducto(id, { stock: nuevoStock });
}

/* ---------------------------------------------------------------------- */
/* CLIENTES                                                                */
/* ---------------------------------------------------------------------- */

function obtenerClientes() {
  return _leer(KEYS.CLIENTES);
}

function obtenerClientePorId(id) {
  return obtenerClientes().find((c) => c.id === id) || null;
}

function guardarCliente(cliente) {
  const clientes = obtenerClientes();
  const nuevo = {
    ...cliente,
    id: cliente.id || _generarId('CLI', clientes),
    fechaRegistro: cliente.fechaRegistro || new Date().toISOString(),
  };
  clientes.push(nuevo);
  _escribir(KEYS.CLIENTES, clientes);
  return nuevo;
}

function actualizarCliente(id, cambios) {
  const clientes = obtenerClientes();
  const idx = clientes.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  clientes[idx] = { ...clientes[idx], ...cambios };
  _escribir(KEYS.CLIENTES, clientes);
  return clientes[idx];
}

function eliminarCliente(id) {
  const clientes = obtenerClientes().filter((c) => c.id !== id);
  return _escribir(KEYS.CLIENTES, clientes);
}

/* ---------------------------------------------------------------------- */
/* PROVEEDORES                                                            */
/* ---------------------------------------------------------------------- */

function obtenerProveedores() {
  return _leer(KEYS.PROVEEDORES);
}

function obtenerProveedorPorId(id) {
  return obtenerProveedores().find((p) => p.id === id) || null;
}

function guardarProveedor(proveedor) {
  const proveedores = obtenerProveedores();
  const nuevo = { ...proveedor, id: proveedor.id || _generarId('PRV', proveedores) };
  proveedores.push(nuevo);
  _escribir(KEYS.PROVEEDORES, proveedores);
  return nuevo;
}

function actualizarProveedor(id, cambios) {
  const proveedores = obtenerProveedores();
  const idx = proveedores.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  proveedores[idx] = { ...proveedores[idx], ...cambios };
  _escribir(KEYS.PROVEEDORES, proveedores);
  return proveedores[idx];
}

function eliminarProveedor(id) {
  const proveedores = obtenerProveedores().filter((p) => p.id !== id);
  return _escribir(KEYS.PROVEEDORES, proveedores);
}

/* ---------------------------------------------------------------------- */
/* VENTAS                                                                  */
/* ---------------------------------------------------------------------- */

function obtenerVentas() {
  return _leer(KEYS.VENTAS);
}

function obtenerVentaPorId(id) {
  return obtenerVentas().find((v) => v.id === id) || null;
}

function guardarVenta(venta) {
  const ventas = obtenerVentas();
  const numero = ventas.length + 1;
  const nueva = {
    ...venta,
    id: venta.id || _generarId('VNT', ventas),
    numero: venta.numero || String(numero).padStart(6, '0'),
    fecha: venta.fecha || new Date().toISOString(),
  };
  ventas.unshift(nueva);
  _escribir(KEYS.VENTAS, ventas);
  return nueva;
}

function actualizarVenta(id, cambios) {
  const ventas = obtenerVentas();
  const idx = ventas.findIndex((v) => v.id === id);
  if (idx === -1) return null;
  ventas[idx] = { ...ventas[idx], ...cambios };
  _escribir(KEYS.VENTAS, ventas);
  return ventas[idx];
}

/* ---------------------------------------------------------------------- */
/* MOVIMIENTOS DE INVENTARIO                                              */
/* ---------------------------------------------------------------------- */

function obtenerMovimientos() {
  return _leer(KEYS.MOVIMIENTOS);
}

function guardarMovimiento(movimiento) {
  const movimientos = obtenerMovimientos();
  const nuevo = {
    ...movimiento,
    id: movimiento.id || _generarId('MOV', movimientos),
    fecha: movimiento.fecha || new Date().toISOString(),
  };
  movimientos.unshift(nuevo);
  _escribir(KEYS.MOVIMIENTOS, movimientos);
  return nuevo;
}

/* ---------------------------------------------------------------------- */
/* CONFIGURACIÓN                                                          */
/* ---------------------------------------------------------------------- */

function obtenerConfig() {
  return _leer(KEYS.CONFIG, {
    nombreNegocio: 'Pescadería del Mar',
    empleadoActual: 'Empleado Demo',
    impuestoPorcentaje: 0,
    moneda: 'RD$',
  });
}

function guardarConfig(config) {
  _escribir(KEYS.CONFIG, { ...obtenerConfig(), ...config });
  return obtenerConfig();
}

/* ---------------------------------------------------------------------- */
/* RESET / SEED DE DATOS DE DEMOSTRACIÓN                                  */
/* ---------------------------------------------------------------------- */

function limpiarTodo() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

function vaciarTodosLosDatos() {
  limpiarTodo();
  _sembrarDatos();
  localStorage.setItem(KEYS.SEED_VERSION, SEED_VERSION);
}

function asegurarDatosIniciales() {
  // OJO: esta bandera se guarda con localStorage.setItem plano (no _escribir/JSON),
  // para poder compararla directo contra SEED_VERSION sin desajustes de formato.
  const version = localStorage.getItem(KEYS.SEED_VERSION);
  if (version !== SEED_VERSION) {
    _sembrarDatos();
    localStorage.setItem(KEYS.SEED_VERSION, SEED_VERSION);
  }
}

/* ---------------------------------------------------------------------- */
/* RESPALDO: EXPORTAR / IMPORTAR TODA LA BASE DE DATOS                    */
/* ---------------------------------------------------------------------- */

/**
 * Reúne todos los datos del sistema en un solo objeto, listo para
 * descargarse como archivo .json (respaldo completo).
 */
function construirRespaldoCompleto() {
  return {
    tipo: 'respaldo_pescaderia_pos',
    version: SEED_VERSION,
    fechaExportacion: new Date().toISOString(),
    datos: {
      productos: obtenerProductos(),
      clientes: obtenerClientes(),
      proveedores: obtenerProveedores(),
      ventas: obtenerVentas(),
      movimientos: obtenerMovimientos(),
      config: obtenerConfig(),
    },
  };
}

/**
 * Descarga el respaldo completo como archivo .json en la PC del usuario.
 */
function exportarRespaldo() {
  const respaldo = construirRespaldoCompleto();
  const nombreArchivo = `respaldo-pescaderia-${new Date().toISOString().slice(0, 10)}.json`;
  Helpers.descargarArchivo(nombreArchivo, JSON.stringify(respaldo, null, 2), 'application/json');
  return nombreArchivo;
}

/**
 * Restaura todos los datos del sistema a partir de un objeto de respaldo
 * previamente generado por exportarRespaldo(). Sobrescribe los datos actuales.
 */
function importarRespaldo(objetoRespaldo) {
  if (!objetoRespaldo || objetoRespaldo.tipo !== 'respaldo_pescaderia_pos' || !objetoRespaldo.datos) {
    throw new Error('El archivo seleccionado no es un respaldo válido de Pescadería del Mar POS.');
  }
  const { productos, clientes, proveedores, ventas, movimientos, config } = objetoRespaldo.datos;
  _escribir(KEYS.PRODUCTOS, productos || []);
  _escribir(KEYS.CLIENTES, clientes || []);
  _escribir(KEYS.PROVEEDORES, proveedores || []);
  _escribir(KEYS.VENTAS, ventas || []);
  _escribir(KEYS.MOVIMIENTOS, movimientos || []);
  _escribir(KEYS.CONFIG, config || obtenerConfig());
  localStorage.setItem(KEYS.SEED_VERSION, SEED_VERSION);
  return true;
}

/**
 * Genera el reporte de cierre de caja del día: ventas del día, totales por
 * método de pago e inventario completo al momento del cierre. Se descarga
 * como archivo de texto plano, fácil de abrir e imprimir en cualquier PC.
 */
function generarCierreDeCaja() {
  const config = obtenerConfig();
  const productos = obtenerProductos();
  const hoy = new Date();
  const ventasHoy = obtenerVentas().filter((v) => new Date(v.fecha).toDateString() === hoy.toDateString());

  const totalVentas = ventasHoy.reduce((acc, v) => acc + v.total, 0);
  const totalesPorMetodo = ventasHoy.reduce((acc, v) => {
    acc[v.metodoPago] = (acc[v.metodoPago] || 0) + v.total;
    return acc;
  }, {});

  const money = (n) => `${config.moneda}${Number(n).toLocaleString('es-DO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const linea = '-'.repeat(48);
  let texto = '';
  texto += `${linea}\n${config.nombreNegocio.toUpperCase()}\nCIERRE DE CAJA\n${linea}\n`;
  texto += `Fecha: ${hoy.toLocaleDateString('es-DO')}   Hora de cierre: ${hoy.toLocaleTimeString('es-DO')}\n`;
  texto += `Cajero: ${config.empleadoActual}\n${linea}\n\n`;

  texto += `VENTAS DEL DÍA (${ventasHoy.length})\n${linea}\n`;
  if (ventasHoy.length === 0) {
    texto += 'No se registraron ventas hoy.\n\n';
  } else {
    ventasHoy.forEach((v) => {
      texto += `#${v.numero}  ${new Date(v.fecha).toLocaleTimeString('es-DO')}  ${v.metodoPago.padEnd(13)}  ${money(v.total)}\n`;
    });
    texto += `\nTotal del día: ${money(totalVentas)}\n\n`;
    texto += `Por método de pago:\n`;
    Object.entries(totalesPorMetodo).forEach(([metodo, monto]) => {
      texto += `  - ${metodo}: ${money(monto)}\n`;
    });
    texto += '\n';
  }

  texto += `${linea}\nINVENTARIO AL CIERRE (${productos.length} productos)\n${linea}\n`;
  productos.forEach((p) => {
    const estado = p.stock === 0 ? 'AGOTADO' : p.stock <= p.stockMinimo ? 'STOCK BAJO' : 'normal';
    texto += `${p.nombre.padEnd(24)} ${String(p.stock).padStart(8)} ${p.unidad.padEnd(6)} [${estado}]\n`;
  });
  texto += `${linea}\nFin del reporte de cierre.\n`;

  const nombreArchivo = `cierre-caja-${hoy.toISOString().slice(0, 10)}.txt`;
  Helpers.descargarArchivo(nombreArchivo, texto, 'text/plain');
  return nombreArchivo;
}

function _sembrarDatos() {
  // Estado inicial: el sistema arranca completamente vacío, listo para que
  // el negocio cargue sus propios productos, clientes y proveedores reales
  // desde las páginas correspondientes.
  _escribir(KEYS.PROVEEDORES, []);
  _escribir(KEYS.PRODUCTOS, []);
  _escribir(KEYS.CLIENTES, []);
  _escribir(KEYS.CONFIG, {
    nombreNegocio: 'Mi Negocio',
    empleadoActual: 'Empleado',
    impuestoPorcentaje: 0,
    moneda: 'RD$',
  });
  _escribir(KEYS.VENTAS, []);
  _escribir(KEYS.MOVIMIENTOS, []);
}

window.Storage = {
  obtenerProductos,
  obtenerProductoPorId,
  guardarProducto,
  actualizarProducto,
  eliminarProducto,
  ajustarStockProducto,
  obtenerClientes,
  obtenerClientePorId,
  guardarCliente,
  actualizarCliente,
  eliminarCliente,
  obtenerProveedores,
  obtenerProveedorPorId,
  guardarProveedor,
  actualizarProveedor,
  eliminarProveedor,
  obtenerVentas,
  obtenerVentaPorId,
  guardarVenta,
  actualizarVenta,
  obtenerMovimientos,
  guardarMovimiento,
  obtenerConfig,
  guardarConfig,
  limpiarTodo,
  vaciarTodosLosDatos,
  asegurarDatosIniciales,
  construirRespaldoCompleto,
  exportarRespaldo,
  importarRespaldo,
  generarCierreDeCaja,
};
