
'use server';

import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

let db: Database | null = null;

async function initializeDatabase() {
  if (!db) {
    const dbPath = path.join(process.cwd(), 'database.db');
    const newDb = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    // Use serialize to ensure tables are created one by one
    await newDb.exec('PRAGMA journal_mode = WAL;');
    await newDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        coins INTEGER DEFAULT 0,
        isAdmin BOOLEAN DEFAULT FALSE
      );
    `);
    await newDb.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        submittedBy TEXT NOT NULL,
        submittedAt TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        FOREIGN KEY (submittedBy) REFERENCES users(name)
      );
    `);
     await newDb.exec(`
      CREATE TABLE IF NOT EXISTS rewards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'video', 'gift'
          entityId TEXT, -- videoId for video reward
          claimedAt TEXT NOT NULL,
          amount INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    // Check if admin exists, if not, create it
    const admin = await newDb.get('SELECT * FROM users WHERE name = ?', 'Zala kb 101');
    if (!admin) {
        await newDb.run(
            'INSERT INTO users (name, password, isAdmin) VALUES (?, ?, ?)',
            'Zala kb 101',
            'zala1234567',
            true
        );
    }
    db = newDb;
  }
  return db;
}

export async function getDb() {
  return await initializeDatabase();
}
