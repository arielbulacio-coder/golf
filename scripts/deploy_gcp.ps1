
Write-Host "=== Asistente de Despliegue Automático a Google Cloud ===" -ForegroundColor Cyan
Write-Host "Nota: Este script requiere que Google Cloud SDK (gcloud) esté instalado y configurado." -ForegroundColor Yellow

# 1. Verificar instalación de gcloud
if (!(Get-Command "gcloud" -ErrorAction SilentlyContinue)) {
    Write-Host "❌ Error: gcloud CLI no está instalado." -ForegroundColor Red
    Write-Host "1. Descárgalo aquí: https://cloud.google.com/sdk/docs/install"
    Write-Host "2. Instálalo."
    Write-Host "3. Ejecuta 'gcloud init' para loguearte."
    Write-Host "4. Vuelve a ejecutar este script."
    exit
}

# 2. Configuración
$PROJECT_ID = Read-Host "Ingresa tu ID de Proyecto de Google Cloud (Project ID)"
if ([string]::IsNullOrWhiteSpace($PROJECT_ID)) { Write-Host "ID requerido."; exit }

$INSTANCE_NAME = "golf-backend-free"
$ZONE = "us-central1-f"
$REPO_URL = "https://github.com/arielbulacio-coder/golf.git"

# 3. Preparar Script de Inicio (Startup Script)
# Este script se ejecuta DENTRO de la máquina virtual cuando se crea
$StartupScript = @"
#!/bin/bash
# Actualizar y preparar sistema
apt-get update
apt-get install -y nodejs npm git

# Instalar PM2 globalmente
npm install -g pm2

# Clonar repo
mkdir -p /opt/app
git clone $REPO_URL /opt/app/golf
cd /opt/app/golf

# Instalar dependencias
npm install --production

# Inicializar DB
node scripts/seed.js

# Iniciar App
# Usamos puerto 3001
pm2 start backend/server.js --name golf-backend
pm2 save
pm2 startup
"@

# 4. Crear Regla de Firewall
Write-Host "-> Creando regla de firewall para el puerto 3001..."
gcloud compute firewall-rules create allow-golf-3001 --allow tcp:3001 --project $PROJECT_ID --target-tags=golf-server --description="Permitir acceso al backend de Golf"

# 5. Crear Instancia VM
Write-Host "-> Creando Máquina Virtual (Free Tier: e2-micro)..."
gcloud compute instances create $INSTANCE_NAME `
    --project=$PROJECT_ID `
    --zone=$ZONE `
    --machine-type=e2-micro `
    --image-family=debian-11 `
    --image-project=debian-cloud `
    --tags=golf-server,http-server,https-server `
    --metadata=startup-script="$StartupScript" `
    --boot-disk-size=10GB `
    --boot-disk-type=pd-standard

Write-Host "=== ¡Despliegue Iniciado! ===" -ForegroundColor Green
Write-Host "La máquina se está creando e instalando el software. Esto tomará unos 5 minutos."
Write-Host "Usa 'gcloud compute instances list' para ver la IP Externa cuando esté lista."
