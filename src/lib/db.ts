
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

    await newDb.exec('PRAGMA journal_mode = WAL;');
    
    await newDb.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        coins INTEGER DEFAULT 0 NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE NOT NULL
      );
    `);
     await newDb.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    await newDb.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        submittedBy TEXT NOT NULL,
        submittedAt TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (submittedBy) REFERENCES users(name)
      );
    `);
     await newDb.exec(`
      CREATE TABLE IF NOT EXISTS rewards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          type TEXT NOT NULL, -- 'video', 'gift', 'subscribe'
          entityId TEXT, -- videoId for video reward, channel for subscribe
          claimedAt TEXT NOT NULL,
          amount INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);
     await newDb.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId INTEGER NOT NULL,
          channelId TEXT NOT NULL,
          UNIQUE(userId, channelId),
          FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    db = newDb;
  }
  return db;
}

export async function getDb() {
  return await initializeDatabase();
}
