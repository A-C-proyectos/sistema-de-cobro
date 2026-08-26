@echo off
REM ============================================================
REM  Iniciar-App.bat
REM  Abre el sistema POS como una aplicacion de escritorio
REM  (sin barra de direcciones, sin pestanas), usando el
REM  navegador Chrome o Edge que ya tengas instalado.
REM  No requiere instalar nada mas ni tener internet.
REM ============================================================

set "AQUI=%~dp0"
set "PAGINA=%AQUI%index.html"

REM Intentar con Google Chrome primero
where chrome >nul 2>nul
if %errorlevel%==0 (
    start "" chrome --app="%PAGINA%"
    exit /b
)
if exist "%ProgramFiles%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles%\Google\Chrome\Application\chrome.exe" --app="%PAGINA%"
    exit /b
)
if exist "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" (
    start "" "%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe" --app="%PAGINA%"
    exit /b
)

REM Si no hay Chrome, usar Microsoft Edge (viene incluido en Windows)
if exist "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe" --app="%PAGINA%"
    exit /b
)
if exist "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" (
    start "" "%ProgramFiles%\Microsoft\Edge\Application\msedge.exe" --app="%PAGINA%"
    exit /b
)

REM Ultimo recurso: abrir con el navegador predeterminado (modo normal)
start "" "%PAGINA%"
