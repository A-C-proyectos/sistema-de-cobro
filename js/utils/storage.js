/* ==========================================================================
   storage.js — Capa de persistencia (localStorage)
   --------------------------------------------------------------------------
   Toda la lógica de acceso a datos vive aquí. El resto de la aplicación
   nunca debe llamar a localStorage directamente: siempre pasa por las
   funciones exportadas en este archivo. Esto permite, en el futuro,
   sustituir localStorage por llamadas fetch() a una API REST sin tener
   que tocar el resto del código (ver services más abajo).
   ========================================================================== */

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

export function obtenerProductos() {
  return _leer(KEYS.PRODUCTOS);
}

export function obtenerProductoPorId(id) {
  return obtenerProductos().find((p) => p.id === id) || null;
}

export function guardarProducto(producto) {
  const productos = obtenerProductos();
  const nuevo = { ...producto, id: producto.id || _generarId('PRD', productos) };
  productos.push(nuevo);
  _escribir(KEYS.PRODUCTOS, productos);
  return nuevo;
}

export function actualizarProducto(id, cambios) {
  const productos = obtenerProductos();
  const idx = productos.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  productos[idx] = { ...productos[idx], ...cambios };
  _escribir(KEYS.PRODUCTOS, productos);
  return productos[idx];
}

export function eliminarProducto(id) {
  const productos = obtenerProductos().filter((p) => p.id !== id);
  return _escribir(KEYS.PRODUCTOS, productos);
}

export function ajustarStockProducto(id, delta) {
  const producto = obtenerProductoPorId(id);
  if (!producto) return null;
  const nuevoStock = Math.max(0, Math.round((producto.stock + delta) * 1000) / 1000);
  return actualizarProducto(id, { stock: nuevoStock });
}

/* ---------------------------------------------------------------------- */
/* CLIENTES                                                                */
/* ---------------------------------------------------------------------- */

export function obtenerClientes() {
  return _leer(KEYS.CLIENTES);
}

export function obtenerClientePorId(id) {
  return obtenerClientes().find((c) => c.id === id) || null;
}

export function guardarCliente(cliente) {
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

export function actualizarCliente(id, cambios) {
  const clientes = obtenerClientes();
  const idx = clientes.findIndex((c) => c.id === id);
  if (idx === -1) return null;
  clientes[idx] = { ...clientes[idx], ...cambios };
  _escribir(KEYS.CLIENTES, clientes);
  return clientes[idx];
}

export function eliminarCliente(id) {
  const clientes = obtenerClientes().filter((c) => c.id !== id);
  return _escribir(KEYS.CLIENTES, clientes);
}

/* ---------------------------------------------------------------------- */
/* PROVEEDORES                                                            */
/* ---------------------------------------------------------------------- */

export function obtenerProveedores() {
  return _leer(KEYS.PROVEEDORES);
}

export function obtenerProveedorPorId(id) {
  return obtenerProveedores().find((p) => p.id === id) || null;
}

export function guardarProveedor(proveedor) {
  const proveedores = obtenerProveedores();
  const nuevo = { ...proveedor, id: proveedor.id || _generarId('PRV', proveedores) };
  proveedores.push(nuevo);
  _escribir(KEYS.PROVEEDORES, proveedores);
  return nuevo;
}

export function actualizarProveedor(id, cambios) {
  const proveedores = obtenerProveedores();
  const idx = proveedores.findIndex((p) => p.id === id);
  if (idx === -1) return null;
  proveedores[idx] = { ...proveedores[idx], ...cambios };
  _escribir(KEYS.PROVEEDORES, proveedores);
  return proveedores[idx];
}

export function eliminarProveedor(id) {
  const proveedores = obtenerProveedores().filter((p) => p.id !== id);
  return _escribir(KEYS.PROVEEDORES, proveedores);
}

/* ---------------------------------------------------------------------- */
/* VENTAS                                                                  */
/* ---------------------------------------------------------------------- */

export function obtenerVentas() {
  return _leer(KEYS.VENTAS);
}

export function obtenerVentaPorId(id) {
  return obtenerVentas().find((v) => v.id === id) || null;
}

export function guardarVenta(venta) {
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

export function actualizarVenta(id, cambios) {
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

export function obtenerMovimientos() {
  return _leer(KEYS.MOVIMIENTOS);
}

export function guardarMovimiento(movimiento) {
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

export function obtenerConfig() {
  return _leer(KEYS.CONFIG, {
    nombreNegocio: 'Pescadería del Mar',
    empleadoActual: 'Empleado Demo',
    impuestoPorcentaje: 0,
    moneda: 'RD$',
  });
}

export function guardarConfig(config) {
  _escribir(KEYS.CONFIG, { ...obtenerConfig(), ...config });
  return obtenerConfig();
}

/* ---------------------------------------------------------------------- */
/* RESET / SEED DE DATOS DE DEMOSTRACIÓN                                  */
/* ---------------------------------------------------------------------- */

export function limpiarTodo() {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
}

export function reiniciarDatosDemo() {
  limpiarTodo();
  _sembrarDatos();
  _escribir(KEYS.SEED_VERSION, SEED_VERSION);
}

export function asegurarDatosIniciales() {
  const version = localStorage.getItem(KEYS.SEED_VERSION);
  if (version !== SEED_VERSION) {
    _sembrarDatos();
    _escribir(KEYS.SEED_VERSION, SEED_VERSION);
  }
}

function _sembrarDatos() {
  const proveedores = [
    { id: 'PRV0001', empresa: 'Mariscos del Caribe SRL', contacto: 'Juan Peña', telefono: '809-555-0110', correo: 'ventas@mariscoscaribe.do', direccion: 'Av. Duarte 45, Santo Domingo', productos: [] },
    { id: 'PRV0002', empresa: 'Pesquera Atlántica', contacto: 'Rosa Familia', telefono: '809-555-0122', correo: 'contacto@pesqueraatlantica.do', direccion: 'Malecón 12, Santo Domingo', productos: [] },
    { id: 'PRV0003', empresa: 'Distribuidora Marina Azul', contacto: 'Carlos Objío', telefono: '829-555-0133', correo: 'info@marinaazul.do', direccion: 'Zona Portuaria, Boca Chica', productos: [] },
    { id: 'PRV0004', empresa: 'Frescos del Mar Import', contacto: 'Ana Beltré', telefono: '849-555-0144', correo: 'compras@frescosdelmar.do', direccion: 'Km 8 Autopista Duarte', productos: [] },
    { id: 'PRV0005', empresa: 'Cooperativa Pesquera Samaná', contacto: 'Luis Tavárez', telefono: '809-555-0155', correo: 'cooperativa@samana.do', direccion: 'Puerto de Samaná', productos: [] },
  ];

  const productosBase = [
    ['Pargo rojo', 'Pescados', 'kg', 450, 320, 42, 8, '🐟'],
    ['Pargo blanco', 'Pescados', 'kg', 420, 300, 30, 8, '🐟'],
    ['Mero', 'Pescados', 'kg', 520, 380, 18, 6, '🐟'],
    ['Chillo', 'Pescados', 'kg', 480, 340, 25, 6, '🐟'],
    ['Dorado', 'Pescados', 'kg', 500, 360, 5, 6, '🐟'],
    ['Atún', 'Pescados', 'kg', 620, 460, 20, 5, '🐟'],
    ['Sardinas', 'Pescados', 'kg', 180, 110, 60, 15, '🐟'],
    ['Camarones', 'Camarones', 'kg', 800, 600, 15, 5, '🦐'],
    ['Pulpo', 'Pulpo', 'kg', 750, 560, 0, 4, '🐙'],
    ['Calamar', 'Calamar', 'kg', 480, 340, 22, 6, '🦑'],
    ['Cangrejo', 'Cangrejo', 'kg', 400, 280, 12, 5, '🦀'],
    ['Langosta', 'Mariscos', 'kg', 1450, 1100, 8, 3, '🦞'],
    ['Filete de pescado', 'Filetes', 'kg', 550, 400, 33, 8, '🍣'],
    ['Tilapia', 'Pescados', 'kg', 260, 180, 48, 10, '🐟'],
    ['Salmón', 'Pescado congelado', 'kg', 950, 720, 3, 5, '🐟'],
  ];

  const productos = productosBase.map(([nombre, categoria, unidad, precioVenta, precioCompra, stock, stockMinimo, imagen], i) => ({
    id: `PRD${String(i + 1).padStart(4, '0')}`,
    nombre,
    descripcion: `${nombre} fresco, ideal para preparaciones al gusto del cliente.`,
    categoria,
    proveedorId: proveedores[i % proveedores.length].id,
    precioCompra,
    precioVenta,
    unidad,
    stock,
    stockMinimo,
    sku: `SKU-${String(i + 1).padStart(4, '0')}`,
    imagen,
    estado: 'activo',
  }));

  const clientes = [
    { id: 'CLI0001', nombre: 'María Rodríguez', telefono: '809-555-2001', correo: 'maria.rodriguez@mail.com', direccion: 'Calle Sol 12, Santo Domingo', fechaRegistro: new Date(Date.now() - 86400000 * 120).toISOString() },
    { id: 'CLI0002', nombre: 'José Manuel Cruz', telefono: '809-555-2002', correo: 'jmcruz@mail.com', direccion: 'Av. Independencia 88', fechaRegistro: new Date(Date.now() - 86400000 * 95).toISOString() },
    { id: 'CLI0003', nombre: 'Restaurante El Faro', telefono: '809-555-2003', correo: 'compras@elfaro.do', direccion: 'Malecón 200', fechaRegistro: new Date(Date.now() - 86400000 * 70).toISOString() },
    { id: 'CLI0004', nombre: 'Yolanda Pérez', telefono: '829-555-2004', correo: 'yolanda.perez@mail.com', direccion: 'Los Ríos, Santo Domingo Norte', fechaRegistro: new Date(Date.now() - 86400000 * 40).toISOString() },
    { id: 'CLI0005', nombre: 'Hotel Bahía Azul', telefono: '849-555-2005', correo: 'compras@bahiaazul.do', direccion: 'Boca Chica', fechaRegistro: new Date(Date.now() - 86400000 * 10).toISOString() },
  ];

  _escribir(KEYS.PROVEEDORES, proveedores);
  _escribir(KEYS.PRODUCTOS, productos);
  _escribir(KEYS.CLIENTES, clientes);
  _escribir(KEYS.CONFIG, {
    nombreNegocio: 'Pescadería del Mar',
    empleadoActual: 'Empleado Demo',
    impuestoPorcentaje: 0,
    moneda: 'RD$',
  });

  // Ventas y movimientos de ejemplo
  const metodos = ['efectivo', 'tarjeta', 'transferencia', 'pago_movil'];
  const ventas = [];
  const movimientos = [];

  for (let i = 0; i < 10; i++) {
    const p1 = productos[i % productos.length];
    const p2 = productos[(i + 3) % productos.length];
    const cant1 = Math.round((Math.random() * 2 + 0.5) * 4) / 4;
    const cant2 = Math.round((Math.random() * 1.5 + 0.5) * 4) / 4;
    const sub1 = Math.round(p1.precioVenta * cant1);
    const sub2 = Math.round(p2.precioVenta * cant2);
    const subtotal = sub1 + sub2;
    const descuento = i % 4 === 0 ? Math.round(subtotal * 0.05) : 0;
    const total = subtotal - descuento;
    const cliente = clientes[i % clientes.length];
    const fecha = new Date(Date.now() - 86400000 * (9 - i) - i * 3600000).toISOString();

    const venta = {
      id: `VNT${String(i + 1).padStart(4, '0')}`,
      numero: String(i + 1).padStart(6, '0'),
      fecha,
      clienteId: cliente.id,
      empleado: 'Empleado Demo',
      metodoPago: metodos[i % metodos.length],
      items: [
        { productoId: p1.id, nombre: p1.nombre, cantidad: cant1, unidad: p1.unidad, precioUnitario: p1.precioVenta, subtotal: sub1 },
        { productoId: p2.id, nombre: p2.nombre, cantidad: cant2, unidad: p2.unidad, precioUnitario: p2.precioVenta, subtotal: sub2 },
      ],
      subtotal,
      descuento,
      impuesto: 0,
      total,
      efectivoRecibido: metodos[i % metodos.length] === 'efectivo' ? total + 50 : total,
      cambio: metodos[i % metodos.length] === 'efectivo' ? 50 : 0,
      estado: 'completada',
    };
    ventas.push(venta);

    movimientos.push({
      id: `MOV${String(i * 2 + 1).padStart(4, '0')}`,
      productoId: p1.id,
      productoNombre: p1.nombre,
      cantidad: cant1,
      unidad: p1.unidad,
      tipo: 'salida',
      motivo: `Venta #${venta.numero}`,
      fecha,
      usuario: 'Empleado Demo',
    });
    movimientos.push({
      id: `MOV${String(i * 2 + 2).padStart(4, '0')}`,
      productoId: p2.id,
      productoNombre: p2.nombre,
      cantidad: cant2,
      unidad: p2.unidad,
      tipo: 'salida',
      motivo: `Venta #${venta.numero}`,
      fecha,
      usuario: 'Empleado Demo',
    });
  }

  // Un par de entradas de mercancía de ejemplo
  productos.slice(0, 3).forEach((p, i) => {
    movimientos.push({
      id: `MOV${String(21 + i).padStart(4, '0')}`,
      productoId: p.id,
      productoNombre: p.nombre,
      cantidad: 20,
      unidad: p.unidad,
      tipo: 'entrada',
      motivo: 'Compra a proveedor',
      fecha: new Date(Date.now() - 86400000 * (12 + i)).toISOString(),
      usuario: 'Empleado Demo',
    });
  });

  _escribir(KEYS.VENTAS, ventas.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
  _escribir(KEYS.MOVIMIENTOS, movimientos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha)));
}
