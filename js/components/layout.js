/* ==========================================================================
   components/layout.js — sidebar y topbar compartidos
   --------------------------------------------------------------------------
   Cada página llama a inicializarLayout({...}) para inyectar el sidebar y
   el header dentro de los contenedores #sidebar-slot y #topbar-slot,
   evitando duplicar ese markup en cada archivo .html.
   ========================================================================== */

function inicializarLayout({ activo, titulo, subtitulo = '', dentroDePages = false }) {
  Storage.asegurarDatosIniciales();
  const config = Storage.obtenerConfig();
  document.title = `${titulo} · ${config.nombreNegocio}`;

  const sidebarSlot = document.getElementById('sidebar-slot');
  const sidebarSlotPages = document.getElementById('sidebar-slot-pages');
  const topbarSlot = document.getElementById('topbar-slot');

  if (sidebarSlot) {
    sidebarSlot.innerHTML = `
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar__brand">
          <img class="sidebar__brand-icon" src="./assets/logo.png" alt="Logo">
          <span class="sidebar__brand-text">${Helpers.escaparHTML(config.nombreNegocio)}<small>Sistema POS</small></span>
        </div>
        <nav class="sidebar__nav">
          ${Router.RUTAS.map((ruta) => `
            <a class="sidebar__link ${ruta.id === activo ? 'is-active' : ''}" href="${Router.resolverHref(ruta.href, dentroDePages)}">
              <span class="icon">${ruta.icono}</span>
              <span>${ruta.nombre}</span>
            </a>
          `).join('')}
        </nav>
        <div class="sidebar__footer">${Helpers.escaparHTML(config.nombreNegocio)} © ${new Date().getFullYear()}<br>v1.0 · localStorage</div>
      </aside>
    `;
  } else if (sidebarSlotPages) {
    sidebarSlotPages.innerHTML = `
      <div class="sidebar-backdrop" id="sidebar-backdrop"></div>
      <aside class="sidebar" id="sidebar">
        <div class="sidebar__brand">
          <img class="sidebar__brand-icon" src="../assets/logo.png" alt="Logo">
          <span class="sidebar__brand-text">${Helpers.escaparHTML(config.nombreNegocio)}<small>Sistema POS</small></span>
        </div>
        <nav class="sidebar__nav">
          ${Router.RUTAS.map((ruta) => `
            <a class="sidebar__link ${ruta.id === activo ? 'is-active' : ''}" href="${Router.resolverHref(ruta.href, dentroDePages)}">
              <span class="icon">${ruta.icono}</span>
              <span>${ruta.nombre}</span>
            </a>
          `).join('')}
        </nav>
        <div class="sidebar__footer">${Helpers.escaparHTML(config.nombreNegocio)} © ${new Date().getFullYear()}<br>v1.0 · localStorage</div>
      </aside>
    `;
  }

  if (topbarSlot) {
    const stockBajo = Storage.obtenerProductos().filter((p) => p.stock > 0 && p.stock <= p.stockMinimo).length;
    const agotados = Storage.obtenerProductos().filter((p) => p.stock === 0).length;
    const alertas = stockBajo + agotados;
    const iniciales = (config.empleadoActual || 'E D').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

    topbarSlot.innerHTML = `
      <header class="topbar">
        <div class="flex items-center">
          <button class="menu-toggle" id="menu-toggle" aria-label="Abrir menú">☰</button>
          <div class="topbar__title">${Helpers.escaparHTML(titulo)}${subtitulo ? `<span>${Helpers.escaparHTML(subtitulo)}</span>` : ''}</div>
        </div>
        <div class="topbar__actions">
          <div class="topbar__clock" id="topbar-clock"></div>
          <button class="icon-btn" title="Notificaciones de inventario" id="btn-notificaciones">
            🔔
            ${alertas > 0 ? `<span class="icon-btn__badge">${alertas}</span>` : ''}
          </button>
          <div class="topbar__user">
            <div class="topbar__user-avatar">${Helpers.escaparHTML(iniciales || 'ED')}</div>
            <div>
              <div class="topbar__user-name">${Helpers.escaparHTML(config.empleadoActual)}</div>
              <div class="topbar__user-role">Cajero(a)</div>
            </div>
          </div>
          <button class="icon-btn" title="Cerrar sesión" id="btn-logout">⏻</button>
        </div>
      </header>
    `;
  }

  _inicializarReloj();
  _inicializarMenuMovil();
  _inicializarNotificaciones();
  _resaltarActivo(activo);

  const btnLogout = document.getElementById('btn-logout');
  if (btnLogout) {
    btnLogout.addEventListener('click', () => {
      Helpers.mostrarToast('Sesión cerrada (modo demostración)', 'info');
    });
  }
}

function _resaltarActivo(activo) {
  document.querySelectorAll('.sidebar__link').forEach((link) => {
    const ruta = Router.RUTAS.find((r) => link.href.endsWith(r.href.replace('pages/', '')) || link.href.endsWith(r.href));
    if (ruta && ruta.id === activo) link.classList.add('is-active');
  });
}

function _inicializarReloj() {
  const el = document.getElementById('topbar-clock');
  if (!el) return;
  const actualizar = () => {
    const ahora = new Date();
    el.innerHTML = `${ahora.toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })}<br>${ahora.toLocaleTimeString('es-DO', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
  };
  actualizar();
  setInterval(actualizar, 1000);
}

function _inicializarMenuMovil() {
  const toggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!toggle || !sidebar) return;
  const abrir = () => { sidebar.classList.add('is-open'); backdrop?.classList.add('is-open'); };
  const cerrar = () => { sidebar.classList.remove('is-open'); backdrop?.classList.remove('is-open'); };
  toggle.addEventListener('click', abrir);
  backdrop?.addEventListener('click', cerrar);
  sidebar.querySelectorAll('.sidebar__link').forEach((l) => l.addEventListener('click', cerrar));
}

function _inicializarNotificaciones() {
  const btn = document.getElementById('btn-notificaciones');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const productos = Storage.obtenerProductos();
    const criticos = productos.filter((p) => p.stock <= p.stockMinimo);
    if (criticos.length === 0) {
      Helpers.mostrarToast('No hay alertas de inventario por ahora.', 'success');
    } else {
      Helpers.mostrarToast(`${criticos.length} producto(s) con stock bajo o agotado.`, 'warning');
    }
  });
}

window.Layout = { inicializarLayout };
