const { checkClientLimit } = require('../utils/clientUtils');

const { validationResult } = require('express-validator');
const pool = require('../models/db');
const MAX_CLIENTS_PER_MANAGER = 5;

// Создать нового клиента
exports.createClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { companyName, legalForm, assignedManagerId, serviceProfileId } = req.body;

  if (!companyName || !legalForm || !assignedManagerId || !serviceProfileId) {
    return res.status(400).json({ error: 'Все поля обязательны.' });
  }

  // Логируем входные параметры
  console.log('Получены данные для создания клиента:', {
    companyName,
    legalForm,
    assignedManagerId,
    serviceProfileId,
  });

  try {
    // Проверяем существование менеджера
    const managerResult = await pool.query('SELECT * FROM managers WHERE id = $1', [assignedManagerId]);
    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Менеджер не найден.' });
    }

    // Проверяем существование профиля
    const profileResult = await pool.query('SELECT * FROM service_profiles WHERE id = $1', [serviceProfileId]);
    if (profileResult.rows.length === 0) {
      return res.status(404).json({ error: 'Профиль обслуживания не найден.' });
    }

    // Проверяем лимит клиентов у менеджера
    const limitExceeded = await checkClientLimit(assignedManagerId);
    if (limitExceeded) {
      return res.status(400).json({ error: `Менеджер уже достиг лимита в ${MAX_CLIENTS_PER_MANAGER} клиентов.` });
    }

    // Добавляем клиента в базу данных
    const result = await pool.query(
      'INSERT INTO clients (company_name, legal_form, assigned_manager_id, service_profile_id) VALUES ($1, $2, $3, $4) RETURNING *',
      [companyName, legalForm, assignedManagerId, serviceProfileId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при создании клиента:', error.message);
    res.status(500).json({ error: 'Ошибка при создании клиента.' });
  }
};


// Получить список всех клиентов
exports.getAllClients = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM clients');
    res.status(200).json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при получении списка клиентов.' });
  }
};

// Получить клиента по ID
exports.getClientById = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при получении клиента:', error.message);
    res.status(500).json({ error: 'Ошибка при получении клиента.' });
  }
};

// Обновить данные клиента
exports.updateClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { companyName, legalForm, serviceProfileId, assignedManagerId } = req.body;

  try {
    // Проверяем, существует ли профиль обслуживания
    const profile = await pool.query('SELECT * FROM service_profiles WHERE id = $1', [serviceProfileId]);
    if (profile.rows.length === 0) {
      return res.status(400).json({ error: 'Указанный профиль обслуживания не существует.' });
    }

    // Проверяем совместимость профиля клиента и менеджера
    if (assignedManagerId) {
      const manager = await pool.query('SELECT * FROM managers WHERE id = $1', [assignedManagerId]);
      if (manager.rows.length === 0) {
        return res.status(404).json({ error: 'Менеджер не найден.' });
      }
      if (manager.rows[0].service_profile_id !== serviceProfileId) {
        return res.status(400).json({ error: 'Профиль клиента не соответствует профилю менеджера.' });
      }
    }

    // Проверяем лимит клиентов у менеджера
    if (assignedManagerId) {
      const managerClients = await pool.query(
        'SELECT COUNT(*) FROM clients WHERE assigned_manager_id = $1',
        [assignedManagerId]
      );
      const clientCount = parseInt(managerClients.rows[0].count, 10);

      if (clientCount >= 5) { // Лимит клиентов
        return res.status(400).json({ error: 'Менеджер уже достиг лимита клиентов.' });
      }
    }

    // Обновляем данные клиента
    const result = await pool.query(
      `UPDATE clients
       SET company_name = $1, legal_form = $2, service_profile_id = $3, assigned_manager_id = $4
       WHERE id = $5 RETURNING *`,
      [companyName, legalForm, serviceProfileId, assignedManagerId || null, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при обновлении клиента.' });
  }
};


// Удалить клиента
exports.deleteClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;

  try {
    const result = await pool.query('DELETE FROM clients WHERE id = $1 RETURNING *', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден.' });
    }

    res.status(200).json({ message: 'Клиент успешно удалён.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при удалении клиента.' });
  }
};

// Перевести клиента к другому менеджеру
exports.transferClient = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  
  const { id } = req.params;
  const { newManagerId } = req.body;

  if (!newManagerId) {
    return res.status(400).json({ error: 'Поле newManagerId обязательно.' });
  }

  try {
    // Проверяем лимит клиентов у нового менеджера
    const limitExceeded = await checkClientLimit(newManagerId);
    if (limitExceeded) {
      return res.status(400).json({ error: `Менеджер уже достиг лимита в ${MAX_CLIENTS_PER_MANAGER} клиентов.` });
    }

    // Проверяем, существует ли менеджер
    const managerResult = await pool.query('SELECT * FROM managers WHERE id = $1', [newManagerId]);
    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Менеджер не найден.' });
    }

    // Получаем профиль нового менеджера
    const managerProfileId = managerResult.rows[0].service_profile_id;

    // Получаем профиль клиента
    const clientResult = await pool.query('SELECT * FROM clients WHERE id = $1', [id]);
    if (clientResult.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден.' });
    }

    const clientProfileId = clientResult.rows[0].service_profile_id;

    // Проверяем совпадение профилей обслуживания
    if (clientProfileId !== managerProfileId) {
      return res.status(400).json({ error: 'Нельзя перевести клиента менеджеру с другим профилем обслуживания.' });
    }

    const managerClients = await pool.query(
      'SELECT COUNT(*) FROM clients WHERE assigned_manager_id = $1',
      [newManagerId]
    );
    const clientCount = parseInt(managerClients.rows[0].count, 10);

    if (clientCount >= MAX_CLIENTS_PER_MANAGER) {
      return res.status(400).json({ error: `Менеджер уже достиг лимита клиентов (${MAX_CLIENTS_PER_MANAGER}).` });
    }

    // Обновляем клиента
    const result = await pool.query(
      'UPDATE clients SET assigned_manager_id = $1 WHERE id = $2 RETURNING *',
      [newManagerId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден.' });
    }

    console.log(`Клиент ID ${id} успешно переведён к менеджеру ID ${newManagerId}.`);
    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка при переводе клиента:', error.message);
    res.status(500).json({ error: 'Ошибка при переводе клиента.' });
  }
};

exports.changeClientProfileAndTransfer = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { id } = req.params;
  const { newProfileId, newManagerId } = req.body;

  try {
    // Проверяем, существует ли новый профиль обслуживания
    const profile = await pool.query('SELECT * FROM service_profiles WHERE id = $1', [newProfileId]);
    if (profile.rows.length === 0) {
      return res.status(400).json({ error: 'Указанный профиль обслуживания не существует.' });
    }

    // Проверяем, существует ли новый менеджер
    const managerResult = await pool.query('SELECT * FROM managers WHERE id = $1', [newManagerId]);
    if (managerResult.rows.length === 0) {
      return res.status(404).json({ error: 'Менеджер не найден.' });
    }

    const managerProfileId = managerResult.rows[0].service_profile_id;

    // Проверяем, соответствует ли новый профиль клиента профилю нового менеджера
    if (newProfileId !== managerProfileId) {
      return res.status(400).json({ error: 'Нельзя перевести клиента к менеджеру с другим профилем обслуживания.' });
    }

    // Проверяем лимит клиентов у нового менеджера
    const managerClients = await pool.query(
      'SELECT COUNT(*) FROM clients WHERE assigned_manager_id = $1',
      [newManagerId]
    );
    const clientCount = parseInt(managerClients.rows[0].count, 10);

    if (clientCount >= 5) { // Лимит клиентов
      return res.status(400).json({ error: 'Менеджер уже достиг лимита клиентов.' });
    }

    // Одновременно обновляем профиль клиента и его менеджера
    const result = await pool.query(
      `UPDATE clients 
       SET service_profile_id = $1, assigned_manager_id = $2 
       WHERE id = $3 RETURNING *`,
      [newProfileId, newManagerId, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Клиент не найден.' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Ошибка при изменении профиля клиента и переводе к другому менеджеру.' });
  }
};
