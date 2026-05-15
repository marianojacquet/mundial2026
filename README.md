# Mundial 2026 — Fixture & Predicciones

Plataforma web completa para completar el fixture del Mundial de Futbol 2026,
predecir resultados partido a partido y competir por el ranking final con premios.

---

## Deploy rapido — Vercel + Neon (recomendado, gratis)

### Paso 1 — Base de datos en Neon

1. Crear cuenta gratuita en **[neon.tech](https://neon.tech)**
2. Click en **"New Project"** → darle un nombre → crear
3. En el panel del proyecto ir a **Connection Details**
4. Cambiar el selector de **"Connection string"** a **"Pooled connection"**
5. Copiar la URL (la del pooler — termina en `?sslmode=require`)
6. Volver al selector y elegir **"Direct connection"** (sin `-pooler`)
7. Copiar esa URL tambien

Vas a tener dos URLs:
```
Pooler: postgresql://neondb_owner:xxx@ep-xxx-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require
Direct: postgresql://neondb_owner:xxx@ep-xxx.us-east-2.aws.neon.tech/neondb?sslmode=require
```

### Paso 2 — Subir a GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/TU_USUARIO/mundial2026.git
git push -u origin main
```

### Paso 3 — Deploy en Vercel

1. Ir a **[vercel.com](https://vercel.com)** → Sign up con GitHub
2. Click en **"Add New... > Project"**
3. Importar el repo `mundial2026`
4. En **"Environment Variables"** agregar:

| Variable | Valor |
|----------|-------|
| `DATABASE_URL` | URL del **pooler** (Paso 1) |
| `DIRECT_URL` | URL **direct** (Paso 1) |
| `JWT_SECRET` | Clave secreta larga (ver abajo) |
| `NEXT_PUBLIC_APP_URL` | `https://TU-APP.vercel.app` |

**Generar JWT_SECRET** (ejecutar en terminal local):
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

5. Click **"Deploy"** — el build tarda ~1 minuto

### Paso 4 — Crear tablas y cargar datos

Desde tu maquina local con el `.env` configurado:

```bash
cp .env.example .env
# Editar .env con tus URLs de Neon y JWT_SECRET

npm install
npm run db:setup   # crea tablas + carga los 48 equipos y 104 partidos
```

**Credenciales iniciales:**
| Rol | Email | Contrasena |
|-----|-------|-----------|
| Admin | admin@mundial2026.com | admin123 |
| Demo | demo@mundial2026.com | demo123 |

> Cambiar la contrasena del admin desde la base de datos o crear un endpoint de perfil.

### Listo — Tu app esta online

Ir a `https://TU-APP.vercel.app` y listo.

---

## Deploy alternativo — Docker (VPS / Railway / Render)

### Con Docker Compose (VPS propio o local)

```bash
# 1. Clonar el proyecto
git clone https://github.com/TU_USUARIO/mundial2026.git
cd mundial2026

# 2. Editar la variable JWT_SECRET en docker-compose.yml (obligatorio)

# 3. Construir y levantar
docker compose up -d --build

# 4. Cargar datos iniciales
docker compose exec app npx prisma db push
docker compose exec app npm run db:seed

# 5. Ver en http://localhost:3000
```

### En Railway

1. Crear proyecto en **[railway.app](https://railway.app)**
2. Agregar servicio **PostgreSQL** → copiar la URL
3. Agregar servicio **GitHub** → conectar el repo
4. En variables de entorno del servicio app:
   - `DATABASE_URL` y `DIRECT_URL` = la URL de PostgreSQL de Railway
   - `JWT_SECRET` = clave generada
   - `PORT` = `3000`
5. Despues del primer deploy, en el panel de Railway ejecutar:
   ```
   npm run db:setup
   ```

### En Render

1. Crear cuenta en **[render.com](https://render.com)**
2. **New > PostgreSQL** → copiar la Internal Database URL
3. **New > Web Service** → conectar repo → elegir Docker
4. Variables de entorno: igual que Railway
5. Despues del deploy: usar el shell de Render para `npm run db:setup`

---

## Desarrollo local

```bash
# Instalar dependencias
npm install

# Configurar variables
cp .env.example .env
# Editar .env con tu PostgreSQL local (o Neon)

# Crear tablas y cargar datos
npm run db:setup

# Correr en desarrollo
npm run dev
# → http://localhost:3000
```

**Con Docker local (sin instalar PostgreSQL):**
```bash
# Levantar solo la base de datos
docker compose up db -d

# Usar DATABASE_URL=postgresql://mundial:mundial2026pass@localhost:5432/mundial2026 en .env

npm run dev
```

---

## Comandos utiles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de produccion (verifica errores)
npm run start        # Correr el build de produccion
npm run db:push      # Sincronizar schema a la DB
npm run db:seed      # Cargar datos iniciales (equipos + partidos + admin)
npm run db:setup     # db:push + db:seed en un solo comando
npm run db:studio    # GUI para ver/editar la base de datos
npm run db:reset     # Borrar todo y volver a cargar el seed
```

---

## Flujo de uso

### Usuario
1. Se registra en `/register`
2. Solicita 1 o mas planillas desde el dashboard
3. El admin aprueba la solicitud
4. Completa sus predicciones partido a partido:
   - Marcador del partido (obligatorio)
   - Goles en el 1er tiempo (opcional, +0.5 pts si acierta)
   - Tarjetas amarillas o rojas (opcional, +0.5 pts si acierta)
5. Hace clic en **"Enviar planilla"** para bloquearla
6. Los puntos se actualizan automaticamente cuando el admin carga resultados
7. Sigue su posicion en `/ranking`

### Administrador — Panel en `/admin`
1. **Solicitudes** — Aprobar o rechazar pedidos de planillas
2. **Resultados** — Cargar el marcador, goles 1er tiempo y tarjetas de cada partido
3. **Premios** — Configurar los 10 premios del ranking final
4. **Usuarios** — Ver todos los registrados

---

## Sistema de puntaje

| Acierto | Puntos |
|---------|--------|
| Resultado correcto (gano local / empate / gano visitante) | +2.0 |
| Goles exactos en el 1er tiempo (extra opcional) | +0.5 |
| Tarjetas exactas (amarillas o rojas, extra opcional) | +0.5 |
| Resultado incorrecto | 0 |

**Maximo por partido:** 3.0 puntos
**Maximo con 104 partidos:** 312.0 puntos

---

## Stack tecnologico

| Capa | Tecnologia |
|------|-----------|
| Framework | Next.js 14 (App Router) |
| Base de datos | PostgreSQL |
| ORM | Prisma 5 |
| Auth | JWT (jose) + bcryptjs |
| UI | Tailwind CSS |
| Deploy | Vercel (frontend) + Neon (DB) |
| Docker | Node 20 Alpine + docker-compose |

---

## Estructura del proyecto

```
app/
  (auth)/login + register   — Autenticacion
  admin/                    — Panel de administracion
    fixtures/               — Aprobar solicitudes
    matches/                — Cargar resultados
    prizes/                 — Configurar premios
    users/                  — Gestionar usuarios
  dashboard/                — Dashboard del usuario
    fixtures/[id]/          — Completar fixture
  ranking/                  — Ranking publico
  api/                      — API REST
    auth/                   — Login, register, logout, me
    fixtures/               — CRUD planillas y predicciones
    matches/                — Listar partidos
    ranking/                — Datos del ranking
    admin/                  — Endpoints de administracion
    requests/               — Solicitudes del usuario
components/                 — Componentes reutilizables
lib/
  auth.ts                   — JWT helpers
  db.ts                     — Prisma client
  scoring.ts                — Calculo de puntaje
  utils.ts                  — Utilidades
prisma/
  schema.prisma             — Modelos de base de datos
  seed.ts                   — Datos iniciales (48 equipos, 104 partidos)
middleware.ts               — Proteccion de rutas
Dockerfile                  — Imagen de produccion
docker-compose.yml          — Dev/prod con PostgreSQL incluido
```
