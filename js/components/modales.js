/* ==========================================================================
   components/modales.js — modal de confirmación reutilizable
   ========================================================================== */

export function inicializarModalConfirmar() {
  const slot = document.getElementById('modales-slot');
  if (!slot) return;
  slot.insertAdjacentHTML('beforeend', `
    <div class="modal-overlay" id="modal-confirmar">
      <div class="modal modal--sm">
        <div class="modal__body" style="text-align:center; padding-top: var(--space-6);">
          <div class="confirm-icon">⚠</div>
          <h3 class="confirm-titulo" style="margin-bottom: 8px;">¿Estás seguro?</h3>
          <p class="confirm-mensaje text-muted"></p>
        </div>
        <div class="modal__footer" style="justify-content:center;">
          <button class="btn btn-outline" data-cerrar-modal>Cancelar</button>
          <button class="btn btn-danger confirm-btn-aceptar">Eliminar</button>
        </div>
      </div>
    </div>
  `);
}
