const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
  createManager,
  getAllManagers,
  getManagerById,
  updateManager,
  deleteManager,
  getManagerClients
} = require('../controllers/managerController');

const validateManager = [
  body('fullName').trim().notEmpty().withMessage('ФИО не может быть пустым'),
  body('serviceProfileId').isInt().withMessage('serviceProfileId должен быть числом и существовать в базе')
];

const validateManagerId = [
  param('id').isInt().withMessage('ID менеджера должен быть числом')
];

// Создать менеджера (с валидацией)
router.post('/', validateManager, createManager);

// Получить список менеджеров
router.get('/', getAllManagers);

// Получить менеджера по ID (с валидацией)
router.get('/:id', validateManagerId, getManagerById);

// Обновить менеджера (с валидацией)
router.put('/:id', [...validateManagerId, ...validateManager], updateManager);

// Удалить менеджера (с валидацией)
router.delete('/:id', validateManagerId, deleteManager);

// Получить клиентов менеджера (с валидацией)
router.get('/:id/clients', validateManagerId, getManagerClients);

module.exports = router;
