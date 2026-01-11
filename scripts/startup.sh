#!/bin/bash
# Actualizar y preparar sistema
apt-get update
apt-get install -y nodejs npm git

# Instalar PM2 globalmente
npm install -g pm2

# Clonar repo (si no existe)
mkdir -p /opt/app
if [ ! -d "/opt/app/golf" ]; then
    git clone https://github.com/arielbulacio-coder/golf.git /opt/app/golf
fi

cd /opt/app/golf

# Asegurar que tenemos los ultimos cambios
git pull origin main

# Instalar dependencias
npm install --production

# Inicializar DB
node scripts/seed.js

# Iniciar App
# Detener si ya corre para reiniciar
pm2 delete golf-backend || true
pm2 start backend/server.js --name golf-backend
pm2 save
pm2 startup
