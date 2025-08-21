
'use server';

import { open, Database } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

// Singleton-style database connection
let dbInstance: Promise<Database> | null = null;

async function initializeDatabase(): Promise<Database> {
    const dbPath = path.join(process.cwd(), 'database.db');
    console.log(`Initializing database at: ${dbPath}`);
    
    const db = await open({
      filename: dbPath,
      driver: sqlite3.Database
    });

    await db.exec('PRAGMA foreign_keys = ON;');
    await db.exec('PRAGMA journal_mode = WAL;');
    
    console.log("Running migrations...");
    
    // Simplified schema without users
    await db.exec(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        url TEXT NOT NULL,
        submittedByUserId TEXT, -- Can be null or a generic identifier
        submittedAt TEXT NOT NULL,
        status TEXT DEFAULT 'pending' NOT NULL
      );
    `);
    
    console.log("Database initialized successfully.");
    return db;
}

export async function getDb(): Promise<Database> {
  if (!dbInstance) {
    dbInstance = initializeDatabase();
  }
  return dbInstance;
}
