// Простой тест подключения к БД — выполняет SELECT 1
const db = require('../models/db.mysql');

(async () => {
  try {
    const rows = await db.query('SELECT 1 AS ok');
    console.log('OK:', rows);
    process.exit(0);
  } catch (err) {
    console.error('Connection error:', err.message || err);
    process.exit(1);
  }
})();
