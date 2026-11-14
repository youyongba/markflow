const sqlite3 = require('sqlite3').verbose();
const { open } = require('sqlite');
const path = require('path');

let dbPromise = null;
let transactionQueue = Promise.resolve();

async function getDb() {
  if (!dbPromise) {
    dbPromise = open({
      filename: path.join(__dirname, '../../db/markflow.db'),
      driver: sqlite3.Database
    }).then(async (db) => {
      await db.exec('PRAGMA foreign_keys = ON');
      await db.exec(`
        CREATE TABLE IF NOT EXISTS document_activities (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          document_id INTEGER NOT NULL,
          actor_id INTEGER NOT NULL,
          action_type VARCHAR(50) NOT NULL,
          details_json TEXT,
          created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (document_id) REFERENCES tree_nodes(id) ON DELETE CASCADE,
          FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE CASCADE
        );
        CREATE INDEX IF NOT EXISTS idx_document_activities_document_created
          ON document_activities(document_id, created_at DESC, id DESC);
      `);
      return db;
    });
  }
  return dbPromise;
}

function withTransaction(work) {
  const transaction = transactionQueue.then(async () => {
    const db = await getDb();
    await db.exec('BEGIN IMMEDIATE');
    try {
      const result = await work(db);
      await db.exec('COMMIT');
      return result;
    } catch (error) {
      try {
        await db.exec('ROLLBACK');
      } catch (rollbackError) {
        console.error('Database rollback failed:', rollbackError);
      }
      throw error;
    }
  });

  transactionQueue = transaction.catch(() => {});
  return transaction;
}

module.exports = { getDb, withTransaction };