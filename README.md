# 🐟 Pescadería del Mar — Sistema POS e Inventario

Aplicación web completa de punto de venta (POS) e inventario para una pescadería, construida **100% con HTML5, CSS3 y JavaScript vanilla** (módulos ES6), sin frameworks. Los datos se guardan en el `localStorage` del navegador.

---

## 1. Qué es el sistema

Un sistema de administración pensado para el día a día de una pescadería:

- Vender en un POS con soporte para productos por **unidad, kilogramo, libra, ½ kg y ½ libra**, con cantidades decimales.
- Controlar el **inventario** (stock, entradas, salidas, ajustes, mermas, daños, vencimientos, devoluciones).
- Administrar **productos, clientes y proveedores**.
- Consultar el **historial de ventas** y generar **comprobantes**.
- Ver **reportes y gráficos** del negocio (ventas, productos más/menos vendidos, ganancias).

## 2. Estructura de carpetas

```text
pescaderia-pos/
├── index.html                 # Dashboard principal
├── pages/                     # Resto de páginas (POS, inventario, etc.)
├── css/                       # Estilos separados por responsabilidad
├── js/
│   ├── app.js                 # Lógica del dashboard
│   ├── router.js              # Configuración de navegación (sidebar)
│   ├── components/            # Sidebar, topbar y modal de confirmación compartidos
│   ├── pos/                   # Punto de venta: catálogo, carrito, checkout
│   ├── inventario/             # Productos, control de stock, movimientos
│   ├── clientes/
│   ├── proveedores/
│   ├── ventas/
│   ├── reportes/
│   ├── configuracion/
│   └── utils/                 # storage.js, formatters.js, validators.js, helpers.js
└── assets/
```

Cada página HTML es un archivo independiente que comparte el mismo sidebar/header, generados dinámicamente por `js/components/layout.js` para no duplicar código.

## 3. Cómo ejecutarlo

No requiere instalación ni backend. Dos opciones:

**Opción A — abrir directamente:**
Abre `index.html` con doble clic (o "Abrir con → navegador").

> Nota: como el proyecto usa módulos ES6 (`import`/`export`), algunos navegadores bloquean `import` al abrir el archivo con `file://`. Si ves la página en blanco o errores de CORS en la consola, usa la opción B.

**Opción B — servidor local (recomendado):**
```bash
cd pescaderia-pos
python3 -m http.server 8080
# o: npx serve .
```
Luego visita `http://localhost:8080`.

## 4. Cómo funciona el POS

1. Entra a **POS / Nueva venta**.
2. Busca o filtra productos por categoría en el panel izquierdo y toca una tarjeta para agregarla al carrito.
3. En el carrito (panel derecho) puedes ajustar cantidades (incluyendo decimales para productos por peso, ej. `1.5 kg`), aplicar un descuento en RD$ y elegir un cliente opcional.
4. Presiona **COBRAR**, elige el método de pago. Si es efectivo, ingresa el monto recibido: el cambio se calcula automáticamente y no se puede confirmar el pago si el efectivo es insuficiente.
5. Al confirmar, se registra la venta, se descuenta el inventario, se generan los movimientos de salida correspondientes y se muestra el comprobante (con opción de imprimir).

## 5. Cómo funciona el inventario

- **Inventario → Control de stock**: lista todos los productos con su stock actual, mínimo y estado (normal / bajo / agotado), con búsqueda y filtros. Desde ahí puedes registrar entradas o salidas/ajustes rápidamente.
- **Inventario → Historial de movimientos**: muestra todos los movimientos registrados (entradas, salidas, ajustes, daños, vencimientos, devoluciones, mermas) con fecha, producto, cantidad, motivo y usuario.
- **Productos**: gestión completa del catálogo maestro (nombre, descripción, categoría, proveedor, precios, unidad, SKU, stock inicial, estado).
- El sistema valida automáticamente que no se pueda vender o retirar más cantidad de la disponible en stock.

## 6. Cómo se almacenan los datos

Toda la persistencia vive en `js/utils/storage.js`, que envuelve `localStorage` en funciones reutilizables (`guardarProducto`, `obtenerProductos`, `guardarVenta`, `obtenerVentas`, etc.). Ningún otro archivo llama a `localStorage` directamente.

Claves usadas en `localStorage`: `pescaderia_productos`, `pescaderia_clientes`, `pescaderia_proveedores`, `pescaderia_ventas`, `pescaderia_movimientos`, `pescaderia_config`.

## 7. Cómo agregar nuevos productos

Desde **Productos → + Nuevo producto**, o desde **POS/Inventario** si ya tienes la información básica. Completa nombre, categoría, unidad de medida, precios y stock; el SKU se genera automáticamente si se deja en blanco.

## 8. Respaldo de datos, cierre de caja y facturas descargables

Pensado para operar en un negocio local desde una sola PC, sin depender de internet:

- **Respaldo de datos** (`Configuración → Respaldo de datos`): descarga un archivo `.json` con absolutamente todo (productos, clientes, proveedores, ventas, movimientos). Sirve como copia de seguridad manual — guárdalo en una USB o carpeta de respaldo. "Importar respaldo" restaura ese archivo, reemplazando los datos actuales (útil si cambias de PC o si necesitas recuperar información).
- **Cierre de caja** (botón en el Dashboard o en `Configuración`): genera y descarga un archivo `.txt` con la fecha, todas las ventas del día, los totales por método de pago y el inventario completo al momento del cierre. Ideal para archivar cada noche.
- **Factura descargable**: además de imprimir el comprobante al cobrar (o desde el historial de Ventas), el botón "💾 Descargar factura" guarda esa venta como archivo `.txt` individual en la PC.

Recuerda que, aparte de estos respaldos manuales, el sistema **ya guarda todo automáticamente** en el `localStorage` del navegador mientras trabajas — los respaldos son una copia adicional de seguridad, no un reemplazo del guardado automático.

## 9. Cómo reiniciar los datos de demostración

Ve a **Configuración → Reiniciar datos de demostración**. Esto borra todo lo que hayas creado y vuelve a cargar los 15 productos, 5 clientes, 5 proveedores y 10 ventas de ejemplo originales.

## 10. Cómo conectar posteriormente una API/backend

La arquitectura separa intencionalmente:

```
UI (páginas .html + módulos de página)
   ↓
storage.js (capa de datos)
   ↓
localStorage
```

Para conectar un backend real, sustituye únicamente las funciones internas de `js/utils/storage.js` (`_leer` / `_escribir` y las funciones específicas) por llamadas `fetch()` a tu API REST, por ejemplo:

```javascript
export async function obtenerProductos() {
  const res = await fetch('http://localhost:8000/api/productos');
  return res.json();
}
```

Como el resto de la aplicación (páginas POS, inventario, clientes, etc.) solo conoce las funciones exportadas por `storage.js` — nunca `localStorage` directamente — no es necesario modificar el resto del frontend.

---

Hecho con HTML, CSS y JavaScript vanilla. 🐟
