module.exports = (sequelize, DataTypes) => {
  const Good = sequelize.define(
    'Good',
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
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      unit: {
        type: DataTypes.STRING(50),
        allowNull: false,
        defaultValue: 'pcs',
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'goods',
      timestamps: true,
    }
  );

  Good.associate = (models) => {
    Good.hasMany(models.Stock, { foreignKey: 'goodId', as: 'stocks' });
    Good.hasMany(models.Movement, { foreignKey: 'goodId', as: 'movements' });
    Good.hasMany(models.MovementRequest, { foreignKey: 'goodId', as: 'movementRequests' });
  };

  return Good;
};
