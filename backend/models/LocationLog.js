module.exports = (sequelize, DataTypes) => {
  const LocationLog = sequelize.define(
    'LocationLog',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      locationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM('CREATED', 'UPDATED'),
        allowNull: false,
      },
      changes: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      performedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'location_logs',
      timestamps: true,
    }
  );

  LocationLog.associate = (models) => {
    LocationLog.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
    LocationLog.belongsTo(models.User, { foreignKey: 'performedBy', as: 'performer' });
  };

  return LocationLog;
};
