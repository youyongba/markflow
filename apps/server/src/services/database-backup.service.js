const fs = require('fs/promises');
const path = require('path');
const { getDb } = require('../config/database');

const BACKUP_DIR = path.join(__dirname, '../../db/backups');

function getDateStamp(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

async function backupDatabase() {
  const db = await getDb();
  await fs.mkdir(BACKUP_DIR, { recursive: true });

  const backupPath = path.join(BACKUP_DIR, `markflow-${getDateStamp(new Date())}.db`);
  await db.run('VACUUM INTO ?', backupPath);
  console.log(`[Database Backup] Saved to ${backupPath}`);
  return backupPath;
}

function startDatabaseBackupSchedule() {
  const now = new Date();
  const nextMidnight = new Date(now);
  nextMidnight.setHours(24, 0, 0, 0);

  const timer = setTimeout(async () => {
    try {
      await backupDatabase();
    } catch (error) {
      console.error('[Database Backup] Failed:', error);
    } finally {
      startDatabaseBackupSchedule();
    }
  }, nextMidnight.getTime() - now.getTime());

  console.log(`[Database Backup] Next backup scheduled at ${nextMidnight.toLocaleString()}`);
  return timer;
}

module.exports = { backupDatabase, startDatabaseBackupSchedule };
