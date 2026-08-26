# 🐟 Cero Sesenta — Sistema POS e Inventario

Aplicación web completa de punto de venta (POS) e inventario para una pescadería, construida **100% con HTML5, CSS3 y JavaScript vanilla** (módulos ES6), sin frameworks. Los datos se guardan en el `localStorage` del navegador.

---

## 1. Qué es el sistema?

Un sistema de administración pensado para el día a día de una pescadería:

- Vender en un POS con soporte para productos por **unidad, kilogramo, libra, ½ kg y ½ libra**, con cantidades decimales.
- Controlar el **inventario** (stock, entradas, salidas, ajustes, mermas, daños, vencimientos, devoluciones).
- Administrar **productos, clientes y proveedores**.
- Consultar el **historial de ventas** y generar **comprobantes**.
- Ver **reportes y gráficos** del negocio (ventas, productos más/menos vendidos, ganancias).

## 2. Estructura de carpetas no tocar por favor!!!!

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

No requiere instalación, ni backend, ni servidor. Dos formas de abrirlo:

**Forma simple:** doble clic en `index.html` — se abre en tu navegador normal (con barra de direcciones y pestañas, como cualquier página web).

**Forma "como app" (recomendada para el negocio):** doble clic en `Iniciar-App.bat` (Windows) o `Iniciar-App.command` (Mac). Esto abre el sistema en una ventana propia, sin barra de direcciones ni pestañas — se ve y se siente como un programa instalado, no como una página web. Usa el Chrome o Edge que ya tengas instalado; no necesita internet ni instalar nada adicional.

En ambos casos puedes copiar toda la carpeta `pescaderia-pos` a otra PC (por USB, por ejemplo) y funcionará igual ahí — no depende de la ubicación ni de esta PC en particular.

> Nota técnica: los gráficos de la página de Reportes usan una librería (Chart.js) que se carga desde internet. Si esa PC no tiene conexión, todo el resto del sistema (POS, inventario, ventas, clientes) funciona igual; solo los gráficos de Reportes no se mostrarán.

## 3.1. Cómo ponerle el nombre de tu negocio

No hace falta tocar código. Ve a **Configuración → Nombre del negocio**, escribe el nombre real y guarda. Eso actualiza automáticamente:
- El nombre en el sidebar y su pie de página.
- El título de la pestaña del navegador (o de la ventana, si usas el modo app).
- El encabezado de las facturas y el cierre de caja.

El sistema ya viene configurado por defecto con el nombre **"Cero Sesenta"** — si necesitas cambiarlo más adelante, es desde esa misma pantalla, sin tocar código.

## 3.2. Cómo crear un acceso directo en el escritorio con ícono propio

**Windows:**
1. Click derecho sobre `Iniciar-App.bat` → "Crear acceso directo".
2. Mueve ese acceso directo al Escritorio.
3. Click derecho sobre el acceso directo → "Propiedades" → botón "Cambiar icono..." → selecciona tu archivo de logo en formato `.ico` (ver más abajo cómo conseguirlo).
4. Click derecho sobre el acceso directo → "Cambiar nombre" → ponle el nombre que quieras (ej. "Cero Sesenta").

**Mac:**
1. Selecciona `Iniciar-App.command`, cópialo (Cmd+C) y pégalo (Cmd+V) en el Escritorio como acceso directo (alias): con el archivo seleccionado, Cmd+Ctrl+Alt+arrastrar al Escritorio, o click derecho → "Crear alias".
2. Para el ícono: abre tu logo en Vista Previa, Cmd+A y Cmd+C para copiarlo; luego click derecho en el alias → "Obtener información", click en el icono pequeño de la esquina superior izquierda de esa ventana, y Cmd+V para pegar el logo ahí.
3. Renombra el alias con el nombre que quieras.

## 3.3. Si en algún momento quieres un instalador ".exe" de verdad

Lo de arriba (acceso directo + ícono + modo app de Chrome) da la experiencia de una app instalada sin nada adicional. Si más adelante quieres un instalador `.exe` real (con Node.js y Electron), es un paso más técnico que requiere herramientas de desarrollo e internet en la PC donde se construya — avísame si llegas a ese punto y te preparo los archivos necesarios para hacerlo.

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

## 9. Cómo vaciar todos los datos y empezar de cero

Ve a **Configuración → Vaciar todos los datos**. Esto borra por completo productos, clientes, proveedores, ventas y movimientos, dejando el sistema listo para cargar todo desde cero. Se recomienda exportar un respaldo (ver sección 8) antes de usar esta opción, por si necesitas recuperar algo después.

El sistema **arranca vacío por defecto** la primera vez que se abre — no trae productos ni ventas de ejemplo. Carga tus productos reales desde **Productos → + Nuevo producto**.

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

Hecho con HTML, CSS y JavaScript vanilla por inFAMOUSK1:https://github.com/inFAMOUSK1 Y TheSamuWRLD:https://github.com/alexanderheredia
                                                         
