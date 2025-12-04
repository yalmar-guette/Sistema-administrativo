import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';

// Database connection configuration
const dbConfig = {
  host: process.env.DB_HOST || 'gateway01.us-east-1.prod.aws.tidbcloud.com',
  port: parseInt(process.env.DB_PORT) || 4000,
  user: process.env.DB_USER || '2dnDUSHpmxfBkdw.root',
  password: process.env.DB_PASSWORD || 'fxY4fNucsKbrrVaE',
  database: process.env.DB_NAME || 'inventario',
  ssl: {
    rejectUnauthorized: true
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Create connection pool
let pool = null;

function getPool() {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
  }
  return pool;
}

// Database helper functions
export async function dbRun(sql, params = []) {
  const pool = getPool();
  const [result] = await pool.execute(sql, params);
  return result;
}

export async function dbGet(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows[0] || null;
}

export async function dbAll(sql, params = []) {
  const pool = getPool();
  const [rows] = await pool.execute(sql, params);
  return rows;
}

// Initialize database tables
export async function initializeDatabase() {
  try {
    const pool = getPool();

    // Create database if not exists
    await pool.execute(`CREATE DATABASE IF NOT EXISTS inventario`);
    await pool.execute(`USE inventario`);

    // Users table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        role ENUM('superuser', 'owner', 'admin', 'employee') NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Products/Inventory table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        sku VARCHAR(255) UNIQUE,
        quantity INT DEFAULT 0,
        unit_price DECIMAL(10, 2) DEFAULT 0,
        category VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Settings table (for exchange rate)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        \`key\` VARCHAR(255) UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        updated_by INT,
        FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Sales table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sales (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_number VARCHAR(255) UNIQUE NOT NULL,
        date DATE NOT NULL,
        customer_name VARCHAR(255),
        payment_method ENUM('pago_movil', 'pos', 'bs_cash', 'usd_cash', 'zelle', 'binance') NOT NULL,
        total_usd DECIMAL(10, 2) DEFAULT 0,
        total_bs DECIMAL(10, 2) DEFAULT 0,
        exchange_rate_used DECIMAL(10, 2) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Sale items table
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        sale_id INT NOT NULL,
        product_id INT NOT NULL,
        product_name VARCHAR(255) NOT NULL,
        quantity INT NOT NULL,
        unit_price_usd DECIMAL(10, 2) NOT NULL,
        unit_price_bs DECIMAL(10, 2) NOT NULL,
        subtotal_usd DECIMAL(10, 2) NOT NULL,
        subtotal_bs DECIMAL(10, 2) NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
      )
    `);

    // Accounts table (for accounting/libro diario)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        type ENUM('asset', 'liability', 'equity', 'revenue', 'expense') NOT NULL,
        balance DECIMAL(10, 2) DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table (libro diario)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        reference VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by INT,
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
      )
    `);

    // Transaction entries (debe/haber)
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS transaction_entries (
        id INT AUTO_INCREMENT PRIMARY KEY,
        transaction_id INT NOT NULL,
        account_id INT NOT NULL,
        debit DECIMAL(10, 2) DEFAULT 0,
        credit DECIMAL(10, 2) DEFAULT 0,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE SET NULL
      )
    `);

    // Seed super user if no users exist
    const [userRows] = await pool.execute('SELECT COUNT(*) as count FROM users');
    if (userRows[0].count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await pool.execute(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['superuser', 'superuser@inventario.com', hashedPassword, 'superuser']
      );
      console.log('✓ Super user created: superuser / admin123');
    }

    // Seed some basic accounts if none exist
    const [accountRows] = await pool.execute('SELECT COUNT(*) as count FROM accounts');
    if (accountRows[0].count === 0) {
      const accounts = [
        { code: '1000', name: 'Caja', type: 'asset' },
        { code: '1100', name: 'Bancos', type: 'asset' },
        { code: '1200', name: 'Inventario', type: 'asset' },
        { code: '2000', name: 'Cuentas por Pagar', type: 'liability' },
        { code: '3000', name: 'Capital', type: 'equity' },
        { code: '4000', name: 'Ventas', type: 'revenue' },
        { code: '5000', name: 'Costo de Ventas', type: 'expense' },
        { code: '6000', name: 'Gastos Administrativos', type: 'expense' }
      ];

      for (const acc of accounts) {
        await pool.execute(
          'INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)',
          [acc.code, acc.name, acc.type]
        );
      }
      console.log('✓ Basic accounts created');
    }

    // Seed default exchange rate if not exists
    const [settingRows] = await pool.execute('SELECT * FROM settings WHERE `key` = ?', ['exchange_rate']);
    if (settingRows.length === 0) {
      await pool.execute(
        'INSERT INTO settings (`key`, value) VALUES (?, ?)',
        ['exchange_rate', '50.00']
      );
      console.log('✓ Default exchange rate set: 50.00 Bs/$');
    }

    console.log('✓ Database initialized successfully (MySQL/TiDB)');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

export default { dbRun, dbGet, dbAll, initializeDatabase };
