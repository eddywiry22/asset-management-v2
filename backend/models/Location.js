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
      description: {
        type: DataTypes.TEXT,
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
    Location.hasMany(models.MovementHeader, { foreignKey: 'originLocationId', as: 'originMovements' });
    Location.hasMany(models.MovementHeader, { foreignKey: 'destinationLocationId', as: 'destinationMovements' });
  };

  return Location;
};
