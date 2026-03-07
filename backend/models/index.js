const { Sequelize } = require('sequelize');
const dbConfig = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const config = dbConfig[env];

const sequelize = new Sequelize(config.database, config.username, config.password, config);

const db = {
  sequelize,
  Sequelize,
};

// Register models
db.Role = require('./Role')(sequelize, Sequelize.DataTypes);
db.Category = require('./Category')(sequelize, Sequelize.DataTypes);
db.Vendor = require('./Vendor')(sequelize, Sequelize.DataTypes);
db.Location = require('./Location')(sequelize, Sequelize.DataTypes);
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Permission = require('./Permission')(sequelize, Sequelize.DataTypes);
db.Goods = require('./Goods')(sequelize, Sequelize.DataTypes);
db.Stock = require('./Stock')(sequelize, Sequelize.DataTypes);
db.AuditLog = require('./AuditLog')(sequelize, Sequelize.DataTypes);

// Define associations
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
