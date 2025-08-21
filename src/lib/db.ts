
'use server';

import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { Lucia } from 'lucia';
import { BetterSqlite3Adapter } from '@lucia-auth/adapter-sqlite';
import DatabaseConstructor from 'better-sqlite3';

let dbInstance: Database | null = null;
let sqliteInstance: import('better-sqlite3').Database | null = null;

async function initializeDatabase(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'database.db');
    console.log(`Initializing database at: ${dbPath}`);
    
    if (!sqliteInstance) {
      sqliteInstance = new DatabaseConstructor(dbPath);
      sqliteInstance.pragma('journal_mode = WAL');
    }

    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON;');
    
    console.log("Running migrations...");
    
    await db.exec(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT NOT NULL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        coins INTEGER DEFAULT 0,
        isAdmin BOOLEAN DEFAULT FALSE
      );
    `);

    await db.exec(`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT NOT NULL PRIMARY KEY,
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
            status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
            FOREIGN KEY (submittedByUserId) REFERENCES users(id)
        );
    `);
    
    console.log("Database initialized successfully.");
    return db;
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = await initializeDatabase();
  }
  return dbInstance;
}

export async function getSqliteInstance(): Promise<import('better-sqlite3').Database> {
    if (!sqliteInstance) {
        await getDb();
    }
    return sqliteInstance!;
}
