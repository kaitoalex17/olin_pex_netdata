const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5435', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'OlinPexPostgresPass2026!',
  database: process.env.DB_NAME || 'planta_externa',
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
