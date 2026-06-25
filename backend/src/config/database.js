const { Pool } = require('pg');
const config = require('./index');
const logger = require('./logger');

let pool = null;

const createPool = () => {
  const ssl = config.nodeEnv === 'production'
    ? { rejectUnauthorized: false }
    : { rejectUnauthorized: false };

  // Remove sslmode from connection string to avoid conflicts with pool ssl config
  const connectionString = config.databaseUrl
    ? config.databaseUrl.replace(/\?sslmode=require$/, '')
    : config.databaseUrl;

  return new Pool({
    connectionString,
    ssl,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000,
  });
};

const connectDB = async () => {
  try {
    pool = createPool();
    const client = await pool.connect();
    const result = await client.query('SELECT NOW()');
    logger.info(`Database connected at: ${result.rows[0].now}`);
    client.release();
    return pool;
  } catch (error) {
    logger.error('Database connection failed:', error.message);
    throw error;
  }
};

const getPool = () => {
  if (!pool) {
    pool = createPool();
  }
  return pool;
};

const query = async (text, params) => {
  const start = Date.now();
  const result = await getPool().query(text, params);
  const duration = Date.now() - start;
  if (duration > 500) {
    logger.warn(`Slow query (${duration}ms): ${text.substring(0, 100)}`);
  }
  return result;
};

const getClient = async () => {
  const client = await getPool().connect();
  return client;
};

module.exports = { connectDB, getPool, query, getClient };
