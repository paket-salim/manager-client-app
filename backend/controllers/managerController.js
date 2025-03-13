const { validationResult } = require('express-validator');
const pool = require('../models/db');

// Создать нового менеджера
exports.createManager = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { fullName, serviceProfileId } = req.body;

  try {
    // Проверяем, существует ли профиль обслуживания
    const profile = await pool.query('SELECT * FROM service_profiles WHERE id = $1', [serviceProfileId]);
    if (profile.rows.length === 0) {
      return res.status(400).json({ error: 'Указанный профиль обслуживания не существует.' });
    }

    const profileName = profile.rows[0].name;

    const result = await pool.query(
      'INSERT INTO managers (full_name, service_profile_id) VALUES ($1, $2) RETURNING *',
      [fullName, serviceProfileId]
    );

    const newManager = result.rows[0];
    newManager.profile_name = profileName;

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании менеджера:', error.message);
    res.status(500).json({ error: 'Ошибка при создании менеджера.' });
  }
};

// Получить список всех менеджеров
exports.getAllManagers = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT managers.id, managers.full_name, service_profiles.name AS profile_name, service_profiles.id AS service_profile_id
      FROM managers
      LEFT JOIN service_profiles ON managers.service_profile_id = service_profiles.id
    `);

    const managers = result.rows;

    // Получаем клиентов для каждого менеджера
    for (const manager of managers) {
      const clientsResult = await pool.query(`
        SELECT id, company_name, legal_form 
        FROM clients 
        WHERE assigned_manager_id = $1
      `, [manager.id]);
      manager.clients = clientsResult.rows;
    }

    res.json(managers);
  } catch (err) {
    console.error('Ошибка при получении списка всех менеджеров:', err.message);
    res.status(500).json({ error: 'Ошибка при получении менеджеров' });
  }
};

// Получить менеджера по ID
exports.getManagerById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM managers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Менеджер не найден.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении менеджера по ID:', error.message);
    res.status(500).json({ error: 'Ошибка при получении менеджера.' });
  }
};

// Обновить данные менеджера
exports.updateManager = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    console.log("Ошибки валидации:", errors.array());
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { fullName, serviceProfileId } = req.body;

  console.log("Получен запрос на обновление менеджера:", { id, fullName, serviceProfileId });

  try {
    // Проверяем существование профиля обслуживания
    const profileResult = await pool.query(
      'SELECT * FROM service_profiles WHERE id = $1',
      [serviceProfileId]
    );

    if (profileResult.rows.length === 0) {
      console.log("Профиль обслуживания не найден");
      return res.status(404).json({ error: 'Профиль обслуживания не найден.' });
    }

    // Проверяем наличие клиентов у менеджера
    const clientsResult = await pool.query(
      'SELECT * FROM clients WHERE assigned_manager_id = $1',
      [id]
    );

    const clients = clientsResult.rows;

    // Если у менеджера есть клиенты с несовместимыми профилями
    const incompatibleClients = clients.filter(client => client.service_profile_id !== serviceProfileId);
    if (incompatibleClients.length > 0) {
      console.log("Менеджер имеет клиентов с другим профилем обслуживания.");
      return res.status(400).json({
        error: 'Нельзя изменить профиль менеджера, так как у него есть клиенты с другим профилем обслуживания.'
      });
    }

    // Обновляем данные менеджера
    const result = await pool.query(
      'UPDATE managers SET full_name = $1, service_profile_id = $2 WHERE id = $3 RETURNING *',
      [fullName, serviceProfileId, id]
    );

    if (result.rows.length === 0) {
      console.log("Менеджер не найден");
      return res.status(404).json({ error: 'Менеджер не найден.' });
    }

    // Добавляем имя профиля к возвращаемому объекту
    const updatedManager = result.rows[0];
    updatedManager.profile_name = profileResult.rows[0].name;

    console.log("Менеджер успешно обновлён:", updatedManager);
    res.status(200).json(updatedManager);
  } catch (error) {
    console.error("Ошибка при обновлении менеджера:", error.message);
    res.status(500).json({ error: "Ошибка при обновлении менеджера." });
  }
};

// Удалить менеджера
exports.deleteManager = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM managers WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Менеджер не найден.' });
    }

    res.status(200).json({ message: 'Менеджер успешно удалён.' });
  } catch (error) {
    console.error('Ошибка при удалении менеджера:', error.message);
    res.status(500).json({ error: 'Ошибка при удалении менеджера.' });
  }
};

// Получить клиентов менеджера
exports.getManagerClients = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;

  try {
    // Проверяем, существует ли менеджер
    const manager = await pool.query('SELECT * FROM managers WHERE id = $1', [id]);
    if (manager.rows.length === 0) {
      return res.status(404).json({ error: 'Менеджер не найден.' });
    }

    // Получаем клиентов
    const result = await pool.query('SELECT * FROM clients WHERE assigned_manager_id = $1', [id]);
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    console.error('Ошибка при получении списка клиентов менеджера:', error.message);
    res.status(500).json({ error: 'Ошибка при получении списка клиентов менеджера.' });
  }
};
