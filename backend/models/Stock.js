module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define(
    'Stock',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      goodsId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'goods_id',
      },
      locationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'location_id',
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
      },
      lastUpdatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'last_updated_at',
      },
    },
    {
      tableName: 'stock',
      timestamps: false,
    }
  );

  Stock.associate = (models) => {
    Stock.belongsTo(models.Goods, { foreignKey: 'goodsId', as: 'goods' });
    Stock.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
  };

  return Stock;
};
