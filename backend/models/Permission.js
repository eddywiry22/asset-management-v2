module.exports = (sequelize, DataTypes) => {
  const Permission = sequelize.define(
    'Permission',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      roleId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'role_id',
      },
      moduleName: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: 'module_name',
      },
      canView: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'can_view',
      },
      canCreate: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'can_create',
      },
      canEdit: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'can_edit',
      },
      canDelete: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'can_delete',
      },
      canApprove: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'can_approve',
      },
      requiresApproval: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'requires_approval',
      },
    },
    {
      tableName: 'permissions',
      timestamps: false,
    }
  );

  Permission.associate = (models) => {
    Permission.belongsTo(models.Role, { foreignKey: 'roleId', as: 'role' });
  };

  return Permission;
};
