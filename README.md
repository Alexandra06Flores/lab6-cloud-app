# Laboratorio 06 — Introducción a Cognitive Computing
## Desarrollo de aplicación usando servicios en la nube (Pregunta 1)

Aplicación web de administrador para gestión de usuarios (CRUD), con:
- **Backend**: Node.js + Express + PostgreSQL (vía `pg`), autenticación con JWT, subida de imágenes a S3.
- **Frontend**: React (Vite), consumiendo la API del backend.
- **Contenedores**: Docker para backend y frontend, orquestados con `docker-compose`.
- **Base de datos**: Amazon RDS (PostgreSQL).
- **Almacenamiento de imágenes**: Amazon S3.
- **Despliegue**: Amazon EC2.

---

## 1. Estructura del proyecto

```
lab6-app/
├── backend/          # API REST (Express)
│   ├── src/
│   │   ├── routes/    (auth.js, users.js)
│   │   ├── db/        (pool.js, seed.js)
│   │   ├── middleware/(auth.js)
│   │   └── utils/     (s3.js)
│   ├── Dockerfile
│   └── .env.example
├── frontend/          # SPA (React + Vite)
│   ├── src/
│   │   ├── pages/      (Login.jsx, UsersList.jsx, UserForm.jsx)
│   │   └── api.js
│   ├── Dockerfile
│   └── .env.example
├── db/
│   └── init.sql        # esquema de la base de datos
└── docker-compose.yml
```

---

## 2. Crear los recursos en AWS

### 2.1 Amazon RDS (PostgreSQL)

1. Consola AWS → **RDS** → Create database.
2. Motor: **PostgreSQL**. Plantilla: **Free tier** (si aplica a tu cuenta) o la más económica disponible.
3. DB instance identifier: `lab6-db`. Usuario maestro: `postgres`. Define una contraseña segura.
4. Public access: **Yes** (para poder conectarte desde tu EC2 o tu máquina; en un entorno real se restringe por VPC).
5. En **Security group** de la instancia RDS, agrega una regla de entrada: puerto **5432**, origen = el Security Group de tu instancia EC2 (o tu IP, para pruebas).
6. Una vez creada, copia el **endpoint** (host) que te da la consola — eso va en `DB_HOST`.
7. Conéctate y ejecuta el script de esquema:
   ```bash
   psql "host=TU_ENDPOINT port=5432 dbname=postgres user=postgres password=TU_PASSWORD" -f db/init.sql
   ```
   (Si el nombre de tu base no es `postgres`, créala primero con `CREATE DATABASE lab6db;` y ajusta `DB_NAME`.)

### 2.2 Amazon S3

1. Consola AWS → **S3** → Create bucket.
2. Nombre único, ej: `lab6-profile-images-diego` (los nombres de bucket son globales).
3. Desmarca "Block all public access" **solo si** quieres que las imágenes sean accesibles directamente por URL (lo normal para este laboratorio). Si tu profesor exige bucket privado, usarías URLs firmadas — avísame y lo ajustamos.
4. Si el bucket es público para lectura, agrega esta **Bucket Policy** (reemplaza el nombre del bucket):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Sid": "PublicReadGetObject",
         "Effect": "Allow",
         "Principal": "*",
         "Action": "s3:GetObject",
         "Resource": "arn:aws:s3:::lab6-profile-images-diego/*"
       }
     ]
   }
   ```

### 2.3 Credenciales IAM para S3

1. Consola AWS → **IAM** → Users → Create user (ej: `lab6-app-user`), acceso programático.
2. Adjunta una política con permisos mínimos sobre el bucket (en vez de `AmazonS3FullAccess`):
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
         "Resource": "arn:aws:s3:::lab6-profile-images-diego/*"
       }
     ]
   }
   ```
3. Genera un **Access Key** para ese usuario y guarda `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`.

---

## 3. Configurar variables de entorno

```bash
cp backend/.env.example backend/.env
# edita backend/.env con tus valores reales de RDS, S3 e IAM

cp frontend/.env.example frontend/.env
# edita VITE_API_URL para que apunte a la IP pública de tu EC2, puerto 4000
```

Crea el usuario administrador inicial (corre una sola vez, localmente o dentro del contenedor backend):
```bash
cd backend
npm install
npm run seed   # crea admin / admin123 (o los valores de ADMIN_USER/ADMIN_PASSWORD en .env)
```

---

## 4. Desplegar en tu instancia EC2

Como ya tienes la instancia creada, los pasos son:

1. **Conéctate por SSH** a tu instancia.
2. Instala Docker y Docker Compose si no los tienes:
   ```bash
   sudo yum update -y        # Amazon Linux
   sudo yum install -y docker git
   sudo service docker start
   sudo usermod -aG docker ec2-user
   # cierra sesión y vuelve a entrar para que el grupo tome efecto

   # docker compose plugin
   sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
   sudo chmod +x /usr/local/bin/docker-compose
   ```
3. Sube el proyecto a la instancia (por `scp`, `git clone` desde tu repo, etc.):
   ```bash
   scp -r lab6-app ec2-user@TU_IP_EC2:~/
   ```
4. En el **Security Group** de la instancia EC2, abre los puertos entrantes:
   - **22** (SSH, ya debería estar abierto)
   - **80** (frontend)
   - **4000** (backend API)
5. Dentro de la instancia:
   ```bash
   cd lab6-app
   cp backend/.env.example backend/.env   # y edítalo con tus valores reales
   export VITE_API_URL=http://TU_IP_PUBLICA_EC2:4000/api
   docker-compose up -d --build
   ```
6. Verifica:
   - Backend: `http://TU_IP_PUBLICA_EC2:4000/api/health` → `{"status":"ok"}`
   - Frontend: `http://TU_IP_PUBLICA_EC2/`

7. Corre el seed del admin dentro del contenedor (o antes de desplegar, como en el paso 3):
   ```bash
   docker exec -it lab6-backend node src/db/seed.js
   ```

---

## 5. Buenas prácticas de seguridad aplicadas

- Contraseñas de admin con **hash bcrypt**, nunca en texto plano.
- Autenticación de rutas CRUD mediante **JWT** con expiración (4h).
- Credenciales (DB, AWS) solo en `.env`, nunca en el código ni en el repositorio (agrega `.env` a tu `.gitignore`).
- Permisos IAM acotados al bucket específico, no `AdministratorAccess`.
- Conexión a RDS con SSL habilitado (`DB_SSL=true`).
- Validación de tamaño de archivo (5MB máx.) en la subida de imágenes.

**Pendiente de revisar según tu entorno real**: restringir el Security Group de RDS solo al SG de tu EC2 (no a `0.0.0.0/0`), y evaluar si el bucket S3 debe ser privado con URLs firmadas en lugar de público.

---

## 6. Entregables del laboratorio

- [ ] Código fuente (este repositorio)
- [ ] Capturas de evidencia: RDS activo, bucket S3 con imágenes, instancia EC2, contenedores corriendo (`docker ps`)
- [ ] README (este archivo) como documentación técnica
- [ ] URL del repositorio (súbelo a GitHub/GitLab)
- [ ] Video demostración del funcionamiento (máx. 5 min): login, crear/editar/eliminar usuario con foto, mostrar que la imagen quedó en S3 y el registro en RDS
