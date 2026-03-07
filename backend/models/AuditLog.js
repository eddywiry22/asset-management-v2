module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      entity_type: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entity_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      performed_by_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'audit_logs',
      timestamps: true,
    }
  );

  AuditLog.associate = (models) => {
    AuditLog.belongsTo(models.User, { foreignKey: 'performed_by_id', as: 'performedBy' });
  };

  return AuditLog;
};
