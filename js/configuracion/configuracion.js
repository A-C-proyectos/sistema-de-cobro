/* ==========================================================================
   configuracion.js — página de configuración (pages/configuracion.html)
   ========================================================================== */

import { inicializarLayout } from '../components/layout.js';
import { inicializarModalConfirmar } from '../components/modales.js';
import { obtenerConfig, guardarConfig, reiniciarDatosDemo } from '../utils/storage.js';
import { mostrarToast, confirmarAccion, inicializarCierreModales } from '../utils/helpers.js';

document.addEventListener('DOMContentLoaded', () => {
  inicializarLayout({ activo: 'configuracion', titulo: 'Configuración', subtitulo: 'Preferencias del sistema', dentroDePages: true });
  inicializarModalConfirmar();
  inicializarCierreModales();

  const config = obtenerConfig();
  document.getElementById('campo-nombreNegocio').value = config.nombreNegocio;
  document.getElementById('campo-empleadoActual').value = config.empleadoActual;
  document.getElementById('campo-impuestoPorcentaje').value = config.impuestoPorcentaje;
  document.getElementById('campo-moneda').value = config.moneda;

  document.getElementById('form-configuracion').addEventListener('submit', (e) => {
    e.preventDefault();
    guardarConfig({
      nombreNegocio: document.getElementById('campo-nombreNegocio').value.trim() || 'Pescadería del Mar',
      empleadoActual: document.getElementById('campo-empleadoActual').value.trim() || 'Empleado Demo',
      impuestoPorcentaje: Number(document.getElementById('campo-impuestoPorcentaje').value) || 0,
      moneda: document.getElementById('campo-moneda').value.trim() || 'RD$',
    });
    mostrarToast('✓ Configuración guardada correctamente', 'success');
  });

  document.getElementById('btn-reiniciar-demo').addEventListener('click', () => {
    confirmarAccion({
      titulo: 'Reiniciar datos de demostración',
      mensaje: 'Esto borrará todos los productos, ventas, clientes, proveedores y movimientos actuales, y los reemplazará con los datos de ejemplo originales. Esta acción no se puede deshacer.',
      textoConfirmar: 'Reiniciar datos',
      onConfirmar: () => {
        reiniciarDatosDemo();
        mostrarToast('✓ Datos de demostración reiniciados', 'success');
        setTimeout(() => window.location.reload(), 900);
      },
    });
  });
});
