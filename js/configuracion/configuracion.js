/* ==========================================================================
   configuracion.js — página de configuración (pages/configuracion.html)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  Layout.inicializarLayout({ activo: 'configuracion', titulo: 'Configuración', subtitulo: 'Preferencias del sistema', dentroDePages: true });
  Modales.inicializarModalConfirmar();
  Helpers.inicializarCierreModales();

  const config = Storage.obtenerConfig();
  document.getElementById('campo-nombreNegocio').value = config.nombreNegocio;
  document.getElementById('campo-empleadoActual').value = config.empleadoActual;
  document.getElementById('campo-impuestoPorcentaje').value = config.impuestoPorcentaje;
  document.getElementById('campo-moneda').value = config.moneda;

  document.getElementById('form-configuracion').addEventListener('submit', (e) => {
    e.preventDefault();
    Storage.guardarConfig({
      nombreNegocio: document.getElementById('campo-nombreNegocio').value.trim() || 'Pescadería del Mar',
      empleadoActual: document.getElementById('campo-empleadoActual').value.trim() || 'Empleado Demo',
      impuestoPorcentaje: Number(document.getElementById('campo-impuestoPorcentaje').value) || 0,
      moneda: document.getElementById('campo-moneda').value.trim() || 'RD$',
    });
    Helpers.mostrarToast('✓ Configuración guardada correctamente', 'success');
  });

  document.getElementById('btn-exportar-respaldo').addEventListener('click', () => {
    const nombreArchivo = Storage.exportarRespaldo();
    Helpers.mostrarToast(`✓ Respaldo descargado: ${nombreArchivo}`, 'success');
  });

  document.getElementById('btn-importar-respaldo').addEventListener('click', () => {
    document.getElementById('input-importar-respaldo').click();
  });

  document.getElementById('input-importar-respaldo').addEventListener('change', (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    Helpers.confirmarAccion({
      titulo: 'Importar respaldo',
      mensaje: `Esto reemplazará todos los datos actuales por el contenido de "${archivo.name}". Esta acción no se puede deshacer.`,
      textoConfirmar: 'Importar y reemplazar',
      onConfirmar: () => {
        const lector = new FileReader();
        lector.onload = () => {
          try {
            const objeto = JSON.parse(lector.result);
            Storage.importarRespaldo(objeto);
            Helpers.mostrarToast('✓ Respaldo importado correctamente', 'success');
            setTimeout(() => window.location.reload(), 900);
          } catch (err) {
            Helpers.mostrarToast(err.message || 'No se pudo leer el archivo de respaldo.', 'danger', 5000);
          }
        };
        lector.onerror = () => Helpers.mostrarToast('No se pudo leer el archivo seleccionado.', 'danger');
        lector.readAsText(archivo);
      },
    });

    e.target.value = ''; // permite volver a seleccionar el mismo archivo si hace falta
  });

  document.getElementById('btn-cierre-caja').addEventListener('click', () => {
    const nombreArchivo = Storage.generarCierreDeCaja();
    Helpers.mostrarToast(`✓ Cierre de caja descargado: ${nombreArchivo}`, 'success');
  });

  document.getElementById('btn-vaciar-datos').addEventListener('click', () => {
    Helpers.confirmarAccion({
      titulo: 'Vaciar todos los datos',
      mensaje: 'Esto borrará TODOS los productos, ventas, clientes, proveedores y movimientos actuales, dejando el sistema completamente vacío. Recomendado: exporta un respaldo antes de hacer esto. Esta acción no se puede deshacer.',
      textoConfirmar: 'Vaciar todo',
      onConfirmar: () => {
        Storage.vaciarTodosLosDatos();
        Helpers.mostrarToast('✓ El sistema quedó vacío, listo para empezar de nuevo', 'success');
        setTimeout(() => window.location.reload(), 900);
      },
    });
  });
});
