require('dotenv').config();
const express = require('express');
const cors = require('cors');

const db = require('./models/db'); // Убедитесь, что db.js подключён корректно
const managerRoutes = require('./routes/managerRoutes'); // Импорт маршрутов
const clientRoutes = require('./routes/clientRoutes'); // Импорт маршрутов для клиентов
const serviceProfileRoutes = require('./routes/serviceProfileRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Маршруты для менеджеров
app.use('/api/managers', managerRoutes);

// Маршруты для клиентов
app.use('/api/clients', clientRoutes);

// Маршруты для сервиса
app.use('/api/service-profiles', serviceProfileRoutes);

app.get('/', (req, res) => {
  res.send('Сервер работает!');
});

app.listen(PORT, () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});
