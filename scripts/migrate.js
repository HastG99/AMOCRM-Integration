/**
 * Скрипт миграции: читает migrations/001_init.sql и выполняет запросы.
 * Внимание: разделение на statements простое (split по ';'). Для сложных миграций используйте мигратор.
 */
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const db = require('../models/db.mysql');

async function run() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, '../migrations/001_init.sql'), 'utf8');
    // Разбиваем по `;` (простая реализация)
    const statements = sql.split(/;\s*$/m).map(s => s.trim()).filter(Boolean);
    for (const stmt of statements) {
      console.log('> executing:', stmt.slice(0, 120).replace(/\n/g,' '));
      await db.exec(stmt);
    }
    console.log('Migrations complete');
    process.exit(0);
  } catch (err) {
    console.error('Migration error', err);
    process.exit(1);
  }
}

run();
