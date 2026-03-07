module.exports = (sequelize, DataTypes) => {
  const MovementRequest = sequelize.define(
    'MovementRequest',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      requester_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      asset_description: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      source_location_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      destination_location_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(
          'PENDING_HEAD_APPROVAL',
          'PENDING_DESTINATION_APPROVAL',
          'APPROVED',
          'REJECTED'
        ),
        allowNull: false,
        defaultValue: 'PENDING_HEAD_APPROVAL',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejection_reason: {
        type: DataTypes.STRING(500),
        allowNull: true,
      },
      reviewed_by: {
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
    MovementRequest.belongsTo(models.User, { foreignKey: 'requester_id', as: 'requester' });
    MovementRequest.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  };

  return MovementRequest;
};
