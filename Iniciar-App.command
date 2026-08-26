#!/bin/bash
# ============================================================
#  Iniciar-App.command
#  Abre el sistema POS como una aplicacion de escritorio
#  (sin barra de direcciones, sin pestañas) en macOS, usando
#  Chrome si esta instalado. No requiere internet.
#
#  La primera vez, es posible que macOS pida permiso para
#  ejecutar este archivo (Preferencias del Sistema > Seguridad).
# ============================================================

AQUI="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PAGINA="file://$AQUI/index.html"

if [ -d "/Applications/Google Chrome.app" ]; then
  open -a "Google Chrome" --args --app="$PAGINA"
else
  open "$PAGINA"
fi
