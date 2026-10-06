# Guía de Despliegue en VPS (Hostinger Docker)

Esta guía detalla cómo desplegar **Calles de Posadas** en tu VPS de Hostinger utilizando Docker y el pipeline automatizado de GitHub Actions.

---

## 🏗️ Arquitectura de Despliegue

1. **GitHub Actions (CI/CD):** Al hacer push a la rama `main`, el workflow compila el proyecto, ejecuta los 33 tests automatizados y publica la imagen Docker en GitHub Container Registry (`ghcr.io/gruposim/calles-posadas:latest`).
2. **VPS Hostinger:** Descarga la imagen lista para producción y la ejecuta como contenedor ligero (< 150 MB de RAM), sin consumir recursos de compilación en el servidor.
3. **Persistencia:** La base de datos SQLite (`data/calles.db`) viene empaquetada dentro de la imagen y puede mapearse a un volumen persistente local si se desea actualizar sin reconstruir.

---

## 🚀 Despliegue Rápido en VPS con Docker Compose

Conectate por SSH a tu VPS de Hostinger y ejecutá:

```bash
# 1. Crear directorio del proyecto
mkdir -p ~/calles-posadas && cd ~/calles-posadas

# 2. Descargar docker-compose.yml
curl -sO https://raw.githubusercontent.com/grupoSIM/calles-posadas/main/docker-compose.yml

# 3. Descargar la imagen precompilada e iniciar el servicio
docker compose pull
docker compose up -d
```

Verificá que el contenedor esté corriendo:
```bash
docker compose ps
docker compose logs -f
```

La aplicación responderá en `http://TU_IP_VPS:3000`.

---

## 🔒 Configuración de Dominio y SSL con Nginx (Opcional)

Si tenés un dominio asignado a tu VPS (ej. `calles.posadas.gob.ar` o tu dominio personal):

### 1. Configuración de Nginx
Creá el archivo `/etc/nginx/sites-available/calles-posadas`:

```nginx
server {
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Habilitá el sitio y recargá Nginx:
```bash
sudo ln -s /etc/nginx/sites-available/calles-posadas /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### 2. Certificado SSL Gratuito con Certbot
```bash
sudo certbot --nginx -d tu-dominio.com
```

---

## 🔄 Actualización Continua

Cuando hagas cambios en el repositorio y GitHub Actions genere una nueva versión:

```bash
cd ~/calles-posadas
docker compose pull
docker compose up -d
```
El contenedor se reiniciará con cero downtime y la nueva versión activa.
