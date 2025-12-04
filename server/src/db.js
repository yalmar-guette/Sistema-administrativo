import sqlite3 from 'sqlite3';
import bcrypt from 'bcrypt';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Create database instance
const db = new sqlite3.Database(join(__dirname, '../database.db'));

// Promisify database methods
const dbRun = promisify(db.run.bind(db));
const dbGet = promisify(db.get.bind(db));
const dbAll = promisify(db.all.bind(db));

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Users table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        role TEXT CHECK(role IN ('superuser', 'owner', 'admin', 'employee')) NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Products/Inventory table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS products (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        sku TEXT UNIQUE,
        quantity INTEGER DEFAULT 0,
        unit_price REAL DEFAULT 0,
        category TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Settings table (for exchange rate)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS settings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        key TEXT UNIQUE NOT NULL,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_by INTEGER,
        FOREIGN KEY (updated_by) REFERENCES users(id)
      )
    `);

    // Sales table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sales (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_number TEXT UNIQUE NOT NULL,
        date DATE NOT NULL,
        customer_name TEXT,
        payment_method TEXT CHECK(payment_method IN ('pago_movil', 'pos', 'bs_cash', 'usd_cash', 'zelle', 'binance')) NOT NULL,
        total_usd REAL DEFAULT 0,
        total_bs REAL DEFAULT 0,
        exchange_rate_used REAL NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Sale items table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS sale_items (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sale_id INTEGER NOT NULL,
        product_id INTEGER NOT NULL,
        product_name TEXT NOT NULL,
        quantity INTEGER NOT NULL,
        unit_price_usd REAL NOT NULL,
        unit_price_bs REAL NOT NULL,
        subtotal_usd REAL NOT NULL,
        subtotal_bs REAL NOT NULL,
        FOREIGN KEY (sale_id) REFERENCES sales(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id)
      )
    `);

    // Accounts table (for accounting/libro diario)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        code TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        type TEXT CHECK(type IN ('asset', 'liability', 'equity', 'revenue', 'expense')) NOT NULL,
        balance REAL DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Transactions table (libro diario)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        description TEXT NOT NULL,
        reference TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by INTEGER,
        FOREIGN KEY (created_by) REFERENCES users(id)
      )
    `);

    // Transaction entries (debe/haber)
    await dbRun(`
      CREATE TABLE IF NOT EXISTS transaction_entries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        transaction_id INTEGER NOT NULL,
        account_id INTEGER NOT NULL,
        debit REAL DEFAULT 0,
        credit REAL DEFAULT 0,
        FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE,
        FOREIGN KEY (account_id) REFERENCES accounts(id)
      )
    `);

    // Seed super user if no users exist
    const userCount = await dbGet('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
      const hashedPassword = bcrypt.hashSync('admin123', 10);
      await dbRun(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
        ['superuser', 'superuser@inventario.com', hashedPassword, 'superuser']
      );
      console.log('✓ Super user created: superuser / admin123');
    }

    // Seed some basic accounts if none exist
    const accountCount = await dbGet('SELECT COUNT(*) as count FROM accounts');
    if (accountCount.count === 0) {
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
        await dbRun(
          'INSERT INTO accounts (code, name, type) VALUES (?, ?, ?)',
          [acc.code, acc.name, acc.type]
        );
      }
      console.log('✓ Basic accounts created');
    }

    // Seed default exchange rate if not exists
    const exchangeRateSetting = await dbGet('SELECT * FROM settings WHERE key = ?', ['exchange_rate']);
    if (!exchangeRateSetting) {
      await dbRun(
        'INSERT INTO settings (key, value) VALUES (?, ?)',
        ['exchange_rate', '51.89']
      );
      console.log('✓ Default exchange rate set: 51.89 Bs/$');
    }

    console.log('✓ Database initialized');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Export promisified methods
export { dbRun, dbGet, dbAll };
export default db;
