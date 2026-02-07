@echo off
cd /d "%~dp0"
echo.
echo ========================================
echo   Word Snap - Servidor Local
echo ========================================
echo.
echo Iniciando servidor en http://localhost:8000
echo.
echo Abre tu navegador en:
echo   http://localhost:8000/word-snap.html
echo.
echo Presiona Ctrl+C para detener el servidor
echo ========================================
echo.
python -m http.server 8000
pause
