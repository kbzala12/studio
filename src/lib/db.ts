
'use server';

import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

// Singleton-style database connection
let dbInstance: Promise<Database> | null = null;

async function initializeDatabase(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'database.db');
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON;');
    await db.exec('PRAGMA journal_mode = WAL;');
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT UNIQUE NOT NULL,
        password TEXT NOT NULL,
        coins INTEGER DEFAULT 0 NOT NULL,
        isAdmin BOOLEAN DEFAULT FALSE NOT NULL
      );
    `);
     await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        expires_at INTEGER NOT NULL,
        user_id TEXT NOT NULL,
        FOREIGN KEY (user_id) REFERENCES users(id)
      );
    `);
    await db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        submittedByUserId TEXT NOT NULL,
        submittedAt TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL,
        FOREIGN KEY (submittedByUserId) REFERENCES users(id)
      );
    `);
     await db.exec(`
      CREATE TABLE IF NOT EXISTS rewards (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          type TEXT NOT NULL, -- 'video', 'gift', 'subscribe'
          entityId TEXT, -- videoId for video reward, channel for subscribe
          claimedAt TEXT NOT NULL,
          amount INTEGER NOT NULL,
          FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);
     await db.exec(`
      CREATE TABLE IF NOT EXISTS subscriptions (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          userId TEXT NOT NULL,
          channelId TEXT NOT NULL,
          UNIQUE(userId, channelId),
          FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    return db;
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}
