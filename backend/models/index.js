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
db.User           = require('./User')(sequelize, Sequelize.DataTypes);
db.Location       = require('./Location')(sequelize, Sequelize.DataTypes);
db.Item           = require('./Item')(sequelize, Sequelize.DataTypes);
db.Stock          = require('./Stock')(sequelize, Sequelize.DataTypes);
db.MovementHeader = require('./MovementHeader')(sequelize, Sequelize.DataTypes);
db.MovementDetail = require('./MovementDetail')(sequelize, Sequelize.DataTypes);

// Define associations here
Object.values(db).forEach((model) => {
  if (model.associate) {
    model.associate(db);
  }
});

module.exports = db;
