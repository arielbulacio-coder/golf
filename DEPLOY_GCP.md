# Guía de Despliegue Gratuito en Google Cloud Platform (GCP)

Para alojar tu Backend (Node.js) y Base de Datos (SQLite) de forma **gratuita** en Google Cloud, la mejor opción es usar **Compute Engine (Máquina Virtual)**.

Google ofrece una "Capa Gratuita" (Free Tier) que incluye una instancia `e2-micro` en regiones específicas (como `us-central1`, `us-west1` o `us-east1`).

## Pasos para el Despliegue

### 1. Crear la Máquina Virtual
1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. En el menú, ve a **Compute Engine** > **Instancias de VM**.
3. Haz clic en **Crear Instancia**.
4. **Configuración clave para ser GRATIS**:
   - **Región**: `us-central1` (Iowa), `us-west1` (Oregon) o `us-east1` (South Carolina).
   - **Serie**: `E2`.
   - **Tipo de máquina**: `e2-micro` (2 vCPU, 1 GB de memoria).
   - **Disco de arranque**: Cambiar a **Standard persistent disk** (hasta 30GB es gratis). Elige **Ubuntu 22.04 LTS** o **Debian**.
   - **Firewall**: Marca las casillas "Permitir tráfico HTTP" y "Permitir tráfico HTTPS".
5. Haz clic en **Crear**.

### 2. Configurar la VM
Una vez creada, haz clic en el botón **SSH** para conectar a la terminal de tu servidor.

Ejecuta los siguientes comandos para instalar Node.js y Git:

```bash
# Actualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs git

# Verificar instalación
node -v
npm -v
```

### 3. Clonar y Ejecutar tu Proyecto
```bash
# Clonar tu repositorio (asegúrate de que sea público o usa un token)
git clone https://github.com/arielbulacio-coder/golf.git
cd golf

# Instalar dependencias
npm install

# Inicializar Base de Datos
node scripts/seed.js

# Instalar PM2 (para mantener el servidor corriendo siempre)
sudo npm install -g pm2

# Iniciar el servidor en el puerto 80 (para que sea accesible web)
# Nota: Necesitamos redirigir el puerto 3001 o correrlo como root en puerto 80.
# La forma más fácil es usar authbind o correr en 3001 y abrir el firewall.
# Vamos a correrlo en 3001 y abrir el puerto en Google Cloud.

pm2 start backend/server.js --name "golf-backend"
pm2 save
pm2 startup
```

### 4. Abrir el Puerto 3001 en Google Cloud
Por defecto, solo los puertos 80 y 443 están abiertos.
1. En la consola de GCP, busca **Red de VPC** > **Firewall**.
2. **Crear regla de firewall**.
3. **Nombre**: `allow-golf-backend`.
4. **Destinos**: `Todas las instancias de la red`.
5. **Intervalos de IP de origen**: `0.0.0.0/0`.
6. **Protocolos y puertos**:
   - tcp: `3001`
7. Clic en **Crear**.

### 5. Conectar tu Frontend
1. Copia la **IP Externa** de tu VM desde la consola de Compute Engine.
2. En tu proyecto local, crea un archivo `.env` o configura la variable de entorno en GitHub Actions:
   ```
   VITE_API_URL=http://<TU_IP_EXTERNA>:3001
   ```
3. Vuelve a hacer deploy de tu frontend.

¡Listo! Tu backend SQLite ahora vive en una nube gratuita de Google y persistirá los datos en el disco de la VM.
