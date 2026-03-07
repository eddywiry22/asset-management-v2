require('dotenv').config();

// ---------------------------------------------------------------------------
// Enforce required environment variables at startup before anything else loads
// ---------------------------------------------------------------------------
const REQUIRED_ENV = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
const missing = REQUIRED_ENV.filter((key) => !process.env[key]);
if (missing.length > 0) {
  console.error(
    `[FATAL] Missing required environment variable(s): ${missing.join(', ')}. ` +
      'Set them in your .env file or environment before starting the server.'
  );
  process.exit(1);
}

const app = require('./app');
const { sequelize } = require('./models');

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');

    const server = app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      console.log(`\n${signal} received. Shutting down gracefully...`);
      server.close(async () => {
        console.log('HTTP server closed.');
        try {
          await sequelize.close();
          console.log('Database connection closed.');
        } catch (err) {
          console.error('Error closing database connection:', err);
        }
        process.exit(0);
      });

      // Force shutdown after 10 seconds if graceful shutdown stalls
      setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason) => {
      console.error('Unhandled Rejection:', reason);
      shutdown('unhandledRejection');
    });
  } catch (error) {
    console.error('Unable to connect to the database:', error);
    process.exit(1);
  }
};

startServer();
