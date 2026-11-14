-- Esquema inicial para Laboratorio 06 - Introducción a Cognitive Computing
-- Base de datos: Amazon RDS (PostgreSQL)

CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(150) NOT NULL,
    email VARCHAR(150) UNIQUE NOT NULL,
    phone VARCHAR(30),
    profile_image_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Admin por defecto: usuario "admin", password "admin123"
-- IMPORTANTE: el hash se genera con bcrypt al correr seed.js (ver backend/src/db/seed.js)
-- No se inserta aquí en texto plano por seguridad.
