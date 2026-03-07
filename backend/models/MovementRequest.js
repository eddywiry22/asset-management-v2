module.exports = (sequelize, DataTypes) => {
  const MovementRequest = sequelize.define(
    'MovementRequest',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('in', 'out', 'transfer'),
        allowNull: false,
      },
      fromLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      toLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      goodId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requestedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      approvedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
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
    MovementRequest.belongsTo(models.Good, { foreignKey: 'goodId', as: 'good' });
    MovementRequest.belongsTo(models.User, { foreignKey: 'requestedBy', as: 'requester' });
    MovementRequest.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
  };

  return MovementRequest;
};
