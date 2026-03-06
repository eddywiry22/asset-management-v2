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
        validate: {
          notEmpty: true,
          len: [1, 150],
        },
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: { notEmpty: true },
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
    },
    {
      tableName: 'locations',
      timestamps: true,
    }
  );

  Location.associate = (models) => {
    Location.hasMany(models.LocationLog, { foreignKey: 'locationId', as: 'logs' });
    Location.hasMany(models.MovementRequest, { foreignKey: 'fromLocationId', as: 'outboundRequests' });
    Location.hasMany(models.MovementRequest, { foreignKey: 'toLocationId', as: 'inboundRequests' });
  };

  return Location;
};
