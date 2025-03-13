const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
  createClient,
  getAllClients,
  getClientById,
  updateClient,
  deleteClient,
  transferClient,
  changeClientProfileAndTransfer
} = require('../controllers/clientController');

const validateClient = [
  body('companyName').trim().notEmpty().withMessage('Наименование компании обязательно'),
  body('legalForm').trim().notEmpty().withMessage('Организационная форма обязательна'),
  body('serviceProfileId').isInt().withMessage('serviceProfileId должен быть числом и существовать в базе'),
  body('assignedManagerId')
  .optional({ nullable: true }).isInt().withMessage('assignedManagerId должен быть числом')
];

const validateClientId = [
  param('id').isInt().withMessage('ID клиента должен быть числом')
];

const validateTransfer = [
  body('newManagerId').isInt().withMessage('ID нового менеджера должен быть числом')
];

const validateChangeProfileAndTransfer = [
  body('newProfileId').isInt().withMessage('ID нового профиля обслуживания должен быть числом'),
  body('newManagerId').isInt().withMessage('ID нового менеджера должен быть числом')
];

// Создать клиента (с валидацией)
router.post('/', validateClient, createClient);

// Получить список клиентов
router.get('/', getAllClients);

// Получить клиента по ID (с валидацией)
router.get('/:id', validateClientId, getClientById);

// Обновить клиента (с валидацией)
router.put('/:id', [...validateClientId, ...validateClient], updateClient);

// Удалить клиента (с валидацией)
router.delete('/:id', validateClientId, deleteClient);

// Перевести клиента к другому менеджеру (с валидацией)
router.put('/:id/transfer', [...validateClientId, ...validateTransfer], transferClient);

// Изменить профиль клиента и перевести его к другому менеджеру
router.put('/:id/change-profile-and-transfer', validateClientId, validateChangeProfileAndTransfer, changeClientProfileAndTransfer);

module.exports = router;
