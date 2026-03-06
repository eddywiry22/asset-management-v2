module.exports = (sequelize, DataTypes) => {
  const MovementRequest = sequelize.define(
    'MovementRequest',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      fromLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      toLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED', 'CANCELLED', 'REJECTED'),
        allowNull: false,
        defaultValue: 'PENDING',
      },
      requestedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'movement_requests',
      timestamps: true,
    }
  );

  MovementRequest.associate = (models) => {
    MovementRequest.belongsTo(models.Location, { foreignKey: 'fromLocationId', as: 'fromLocation' });
    MovementRequest.belongsTo(models.Location, { foreignKey: 'toLocationId', as: 'toLocation' });
    MovementRequest.belongsTo(models.User, { foreignKey: 'requestedBy', as: 'requester' });
  };

  return MovementRequest;
};
