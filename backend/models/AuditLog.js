module.exports = (sequelize, DataTypes) => {
  const AuditLog = sequelize.define(
    'AuditLog',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      userEmail: {
        type: DataTypes.STRING(150),
        allowNull: true,
      },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entity: {
        type: DataTypes.STRING(50),
        allowNull: false,
      },
      entityId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      before: {
        type: DataTypes.JSON,
        allowNull: true,
      },
      after: {
        type: DataTypes.JSON,
        allowNull: true,
      },
    },
    {
      tableName: 'audit_logs',
      timestamps: true,
    }
  );

  AuditLog.associate = (_models) => {
    // AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'actor', constraints: false });
  };

  return AuditLog;
};
