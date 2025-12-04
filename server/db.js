import Database from 'better-sqlite3';

let db;

export function initDb() {
    db = new Database('./users.db');
    db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    db.exec('CREATE INDEX IF NOT EXISTS idx_email ON users(email)');
    db.exec('CREATE INDEX IF NOT EXISTS idx_created_at ON users(created_at)');
    console.log('✅ Banco de dados inicializado.');
}

export function getDb() {
    if (!db) throw new Error('DB não inicializado. Chame initDb() primeiro.');
    return db;
}

export default db;