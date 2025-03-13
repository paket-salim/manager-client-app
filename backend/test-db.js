const { Pool } = require('pg');
require('dotenv').config();

console.log('process.env.DB_HOST =', process.env.DB_HOST);
console.log('process.env.DB_PORT =', process.env.DB_PORT);
console.log('process.env.DB_USER =', process.env.DB_USER);
console.log('process.env.DB_PASSWORD =', process.env.DB_PASSWORD);
console.log('process.env.DB_NAME =', process.env.DB_NAME);

const pool = new Pool({
  host: 'localhost',
  port: 5432,
  user: 'postgres',
  password: '1234',
  database: 'manager_db',
});

pool.connect()
  .then(() => {
    console.log('Успешно подключено к базе данных!');
    pool.end();
  })
  .catch((err) => {
    console.error('Ошибка подключения к базе данных:', err);
  });
