const STATUSES = [
  'PENDING_HEAD_APPROVAL',
  'PENDING_DESTINATION_APPROVAL',
  'APPROVED_READY_FOR_FINALIZATION',
  'COMPLETED',
  'REJECTED',
];

module.exports = (sequelize, DataTypes) => {
  const MovementHeader = sequelize.define(
    'MovementHeader',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      movementNumber: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
      },
      originLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      destinationLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      requestedById: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(...STATUSES),
        allowNull: false,
        defaultValue: 'PENDING_HEAD_APPROVAL',
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      rejectionReason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      headApprovedById: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      headApprovedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      destApprovedById: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      destApprovedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      finalizedById: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      finalizedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      rejectedById: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      rejectedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'movement_headers',
      timestamps: true,
    }
  );

  MovementHeader.associate = (models) => {
    MovementHeader.belongsTo(models.Location, { foreignKey: 'originLocationId', as: 'originLocation' });
    MovementHeader.belongsTo(models.Location, { foreignKey: 'destinationLocationId', as: 'destinationLocation' });
    MovementHeader.belongsTo(models.User, { foreignKey: 'requestedById', as: 'requestedBy' });
    MovementHeader.belongsTo(models.User, { foreignKey: 'headApprovedById', as: 'headApprovedBy' });
    MovementHeader.belongsTo(models.User, { foreignKey: 'destApprovedById', as: 'destApprovedBy' });
    MovementHeader.belongsTo(models.User, { foreignKey: 'finalizedById', as: 'finalizedBy' });
    MovementHeader.belongsTo(models.User, { foreignKey: 'rejectedById', as: 'rejectedBy' });
    MovementHeader.hasMany(models.MovementDetail, { foreignKey: 'movementHeaderId', as: 'details' });
  };

  return MovementHeader;
};
