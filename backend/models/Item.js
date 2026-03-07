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

  // Item model is legacy; Stock and MovementDetail now reference Goods as
  // the single source of truth. No cross-model associations remain here.
  Item.associate = (_models) => {};

  return Item;
};
