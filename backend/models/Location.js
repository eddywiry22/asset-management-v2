module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    'Location',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      address: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'locations',
      timestamps: true,
    }
  );

  Location.associate = (models) => {
    Location.hasMany(models.Stock, { foreignKey: 'locationId', as: 'stocks' });
    Location.hasMany(models.Movement, { foreignKey: 'fromLocationId', as: 'outboundMovements' });
    Location.hasMany(models.Movement, { foreignKey: 'toLocationId', as: 'inboundMovements' });
    Location.hasMany(models.MovementRequest, { foreignKey: 'fromLocationId', as: 'outboundRequests' });
    Location.hasMany(models.MovementRequest, { foreignKey: 'toLocationId', as: 'inboundRequests' });
  };

  return Location;
};
