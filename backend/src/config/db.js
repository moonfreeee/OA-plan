require('dotenv').config();

const useWindowsAuth = process.env.DB_USE_WINDOWS_AUTH === 'true';
let hasNativeDriver = false;
let sql = require('mssql');

if (useWindowsAuth) {
  try {
    require.resolve('msnodesqlv8');
    sql = require('mssql/msnodesqlv8');
    hasNativeDriver = true;
  } catch {
    console.warn('[db] Windows 身份验证需要 msnodesqlv8 驱动；当前回退到 SQL 账号连接');
  }
}

const winAuth = useWindowsAuth && hasNativeDriver;

const config = {
  server: process.env.DB_SERVER || 'localhost',
  port: parseInt(process.env.DB_PORT || '1433', 10),
  database: process.env.DB_NAME || 'SDO_OA',
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
    trustedConnection: winAuth,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

if (!winAuth) {
  config.user = process.env.DB_USER || 'sa';
  config.password = process.env.DB_PASSWORD;
}

let pool = null;

async function getPool() {
  if (pool) return pool;
  pool = await sql.connect(config);
  return pool;
}

async function query(text, params = {}) {
  const p = await getPool();
  const request = p.request();
  for (const [key, value] of Object.entries(params)) {
    request.input(key, value);
  }
  return request.query(text);
}

module.exports = { sql, getPool, query, config };
