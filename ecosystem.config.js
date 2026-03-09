/**
 * PM2 Ecosystem Configuration
 * Usage:
 *   pm2 start ecosystem.config.js --env production
 *   pm2 reload ecosystem.config.js --env production
 *   pm2 stop ecosystem.config.js
 */
module.exports = {
  apps: [
    {
      name: 'asset-management-api',
      script: './backend/server.js',
      cwd: __dirname,
      instances: 'max',
      exec_mode: 'cluster',
      watch: false,
      env: {
        NODE_ENV: 'development',
        PORT: 5000,
        DB_HOST: process.env.DB_HOST || '127.0.0.1',
        DB_PORT: process.env.DB_PORT || '3306',
        DB_NAME: process.env.DB_NAME || 'asset_management_dev',
        DB_USER: process.env.DB_USER || 'root',
        DB_PASS: process.env.DB_PASS || '',
        JWT_SECRET: process.env.JWT_SECRET || 'replace_with_a_long_random_string',
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'replace_with_another_long_random_string',
        CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:5173',
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 5000,
        DB_HOST: process.env.DB_HOST,
        DB_PORT: process.env.DB_PORT || '3306',
        DB_NAME: process.env.DB_NAME,
        DB_USER: process.env.DB_USER,
        DB_PASS: process.env.DB_PASS,
        JWT_SECRET: process.env.JWT_SECRET,
        JWT_REFRESH_SECRET: process.env.JWT_REFRESH_SECRET,
        CORS_ORIGIN: process.env.CORS_ORIGIN,
      },
      out_file: './logs/api-out.log',
      error_file: './logs/api-error.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      max_restarts: 10,
      min_uptime: '10s',
      restart_delay: 3000,
      max_memory_restart: '512M',
    },
  ],
};
