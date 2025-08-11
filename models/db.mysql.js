/**
 * Модуль для работы с MySQL через mysql2/promise.
 * Экспортируются: pool, query, exec, getConnection.
 * - query(sql, params)  — SELECT и т.п., возвращает rows
 * - exec(sql, params)   — INSERT/UPDATE/DELETE, возвращает результат (insertId и т.д.)
 * - getConnection()     — получить connection для транзакций
 */
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'amocrm_test',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  queueLimit: 0,
});

async function query(sql, params = []) {
  if (!params.length) {
    const [rows] = await pool.query(sql);
    return rows;
  }
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function exec(sql, params = []) {
  const [res] = await pool.execute(sql, params);
  return res;
}

async function getConnection() {
  return pool.getConnection();
}

module.exports = {
  pool,
  exec,
  query,
  getConnection
};
