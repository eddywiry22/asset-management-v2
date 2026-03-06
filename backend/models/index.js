const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {
  sequelize,
  Sequelize,
};

// Register models here as they are created
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Goods = require('./Goods')(sequelize, Sequelize.DataTypes);
db.AuditLog = require('./AuditLog')(sequelize, Sequelize.DataTypes);

// Define associations here
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
