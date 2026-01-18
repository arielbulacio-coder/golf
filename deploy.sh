#!/bin/bash
echo "==========================================="
echo "   Iniciando Despliegue de Golf..."
echo "==========================================="

echo "[1/3] Descargando cambios..."
git pull origin main

echo "[2/3] Limpiando contenedores viejos..."
docker compose down --remove-orphans || true
docker system prune -f

echo "[3/3] Levantando Golf..."
# Aseguramos que la red 'web' exista (debería existir por Academia, pero por si acaso)
docker network create web 2>/dev/null || true
docker compose up -d --build --force-recreate

echo "==========================================="
echo "   Golf Desplegado!"
echo "==========================================="
echo "NOTA: Recuerda configurar el Portero (en /academia/proxy/nginx.conf) para apuntar a 'golf_frontend'"
