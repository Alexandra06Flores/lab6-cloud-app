const express = require('express');
const multer = require('multer');
const pool = require('../db/pool');
const { requireAuth } = require('../middleware/auth');
const { uploadProfileImage, deleteProfileImageByUrl } = require('../utils/s3');

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});

// Todas las rutas de este archivo requieren admin autenticado
router.use(requireAuth);

// GET /api/users - listar todos
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, full_name, email, phone, profile_image_url, created_at FROM users ORDER BY id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al listar usuarios' });
  }
});

// GET /api/users/:id - consultar uno
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al consultar usuario' });
  }
});

// POST /api/users - crear (con imagen opcional)
router.post('/', upload.single('profile_image'), async (req, res) => {
  const { full_name, email, phone } = req.body;
  if (!full_name || !email) {
    return res.status(400).json({ error: 'full_name y email son requeridos' });
  }

  try {
    let imageUrl = null;
    if (req.file) {
      imageUrl = await uploadProfileImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const result = await pool.query(
      `INSERT INTO users (full_name, email, phone, profile_image_url)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [full_name, email, phone || null, imageUrl]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

// PUT /api/users/:id - actualizar (reemplaza imagen si se envía una nueva)
router.put('/:id', upload.single('profile_image'), async (req, res) => {
  const { full_name, email, phone } = req.body;

  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    let imageUrl = existing.rows[0].profile_image_url;
    if (req.file) {
      await deleteProfileImageByUrl(imageUrl);
      imageUrl = await uploadProfileImage(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const result = await pool.query(
      `UPDATE users
       SET full_name = $1, email = $2, phone = $3, profile_image_url = $4, updated_at = NOW()
       WHERE id = $5 RETURNING *`,
      [
        full_name || existing.rows[0].full_name,
        email || existing.rows[0].email,
        phone !== undefined ? phone : existing.rows[0].phone,
        imageUrl,
        req.params.id,
      ]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') {
      return res.status(409).json({ error: 'El email ya está registrado' });
    }
    console.error(err);
    res.status(500).json({ error: 'Error al actualizar usuario' });
  }
});

// DELETE /api/users/:id - eliminar
router.delete('/:id', async (req, res) => {
  try {
    const existing = await pool.query('SELECT * FROM users WHERE id = $1', [req.params.id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    await deleteProfileImageByUrl(existing.rows[0].profile_image_url);
    await pool.query('DELETE FROM users WHERE id = $1', [req.params.id]);

    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al eliminar usuario' });
  }
});

module.exports = router;
