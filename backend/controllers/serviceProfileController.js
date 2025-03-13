const { validationResult } = require('express-validator');
const pool = require('../models/db');

// Создать новый профиль обслуживания
exports.createServiceProfile = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name } = req.body;

  if (!name) {
    return res.status(400).json({ error: 'Название профиля обслуживания не может быть пустым.' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO service_profiles (name) VALUES ($1) RETURNING *',
      [name]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при создании профиля обслуживания.' });
  }
};

// Получить список всех профилей обслуживания
exports.getAllServiceProfiles = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_profiles');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении профилей обслуживания.' });
  }
};
