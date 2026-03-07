module.exports = (sequelize, DataTypes) => {
  const Item = sequelize.define(
    'Item',
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
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'items',
      timestamps: true,
    }
  );

  Item.associate = (models) => {
    Item.hasMany(models.Stock, { foreignKey: 'itemId', as: 'stocks' });
    Item.hasMany(models.MovementDetail, { foreignKey: 'itemId', as: 'movementDetails' });
  };

  return Item;
};
