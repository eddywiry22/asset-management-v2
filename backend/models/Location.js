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
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'created_by',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      tableName: 'locations',
      timestamps: true,
      paranoid: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      deletedAt: 'deleted_at',
    }
  );

  Location.associate = (models) => {
    Location.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Location.hasMany(models.User, { foreignKey: 'locationId', as: 'users' });
    Location.hasMany(models.Stock, { foreignKey: 'locationId', as: 'stock' });
    Location.hasMany(models.LocationLog, { foreignKey: 'locationId', as: 'logs' });
    Location.hasMany(models.MovementRequest, { foreignKey: 'fromLocationId', as: 'outboundRequests' });
    Location.hasMany(models.MovementRequest, { foreignKey: 'toLocationId', as: 'inboundRequests' });
  };

  return Location;
};
