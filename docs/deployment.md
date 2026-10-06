# Guía de Despliegue en VPS (Hostinger + Traefik)

Esta guía detalla cómo desplegar **Calles de Posadas** en tu VPS de Hostinger utilizando Docker, Traefik como reverse proxy con SSL automático (Let's Encrypt) y el dominio `posadas.ferchamorro.cloud`.

---

## 🏗️ Arquitectura de Despliegue

1. **GitHub Actions (CI/CD):** Al hacer push a `main`, el workflow compila el proyecto, corre los 33 tests automatizados y publica la imagen en GitHub Container Registry (`ghcr.io/gruposim/calles-posadas:latest`).
2. **VPS Hostinger:** Corre Traefik en su red Docker (`pigar-staging_edge`) gestionando certificados SSL y enrutando el tráfico HTTPS hacia el contenedor `calles-posadas`.
3. **Persistencia:** La base de datos SQLite (`data/calles.db`) viene empaquetada dentro de la imagen lista para operar en modo solo lectura.

---

## 🚀 Despliegue en el VPS con Traefik

### 1. Conectate por SSH a tu VPS
```bash
mkdir -p ~/calles-posadas && cd ~/calles-posadas
```

### 2. Descargar docker-compose.yml
```bash
curl -sO https://raw.githubusercontent.com/grupoSIM/calles-posadas/main/docker-compose.yml
```

### 3. Iniciar el contenedor
```bash
docker compose pull
docker compose up -d
```

> **Nota:** Si tu resolver de certificados en Traefik tiene otro nombre en lugar de `letsencrypt` (como `myresolver`), actualizá la etiqueta `traefik.http.routers.calles-posadas.tls.certresolver` en `docker-compose.yml`.

### 4. Configurar DNS
Asegurate de que el registro DNS `posadas.ferchamorro.cloud` (tipo `A` o `CNAME`) apunte a la dirección IP pública de tu VPS de Hostinger.

Una vez propagado el DNS, Traefik obtendrá automáticamente el certificado SSL y el sitio responderá en:
👉 **`https://posadas.ferchamorro.cloud`**

---

## 🔄 Actualización Continua (Cero Downtime)

Cuando hagas cambios en el repositorio y GitHub Actions compile una nueva versión:

```bash
cd ~/calles-posadas
docker compose pull
docker compose up -d
```
El contenedor se actualizará inmediatamente sin interrumpir otros servicios del VPS.
