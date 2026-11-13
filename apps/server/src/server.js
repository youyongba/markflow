const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { initApp } = require('./app');
const { startDatabaseBackupSchedule } = require('./services/database-backup.service');
const PORT = process.env.PORT || 3000;

async function bootstrap() {
  try {
    const app = await initApp();
    startDatabaseBackupSchedule();
    app.listen(PORT, () => {
      console.log(`> Ready on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

bootstrap();
