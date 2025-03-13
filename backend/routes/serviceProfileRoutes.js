const express = require('express');
const { body, param } = require('express-validator');
const router = express.Router();
const {
  createServiceProfile,
  getAllServiceProfiles
} = require('../controllers/serviceProfileController');

const validateServiceProfile = [
  body('name').trim().notEmpty().withMessage('Название профиля обслуживания обязательно')
];

// Создать профиль обслуживания (с валидацией)
router.post('/', validateServiceProfile, createServiceProfile);

// Получить список профилей обслуживания
router.get('/', getAllServiceProfiles);

module.exports = router;
