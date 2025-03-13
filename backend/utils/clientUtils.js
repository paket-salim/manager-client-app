const pool = require('../models/db');

// Максимально допустимое количество клиентов на одного менеджера
const MAX_CLIENTS_PER_MANAGER = 5;

// Проверка лимита клиентов
async function checkClientLimit(managerId) {
  try {
    const clientCountResult = await pool.query(
      'SELECT COUNT(*) AS client_count FROM clients WHERE assigned_manager_id = $1',
      [managerId]
    );
    const clientCount = parseInt(clientCountResult.rows[0].client_count, 10);
    return clientCount >= MAX_CLIENTS_PER_MANAGER;
  } catch (error) {
    console.error('Ошибка при проверке лимита клиентов:', error.message);
    throw error;
  }
}

module.exports = {
  checkClientLimit,
};
