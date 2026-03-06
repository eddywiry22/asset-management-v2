module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define(
    'Stock',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      goods_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      location_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
      last_updated_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'stocks',
      timestamps: true,
      indexes: [
        { unique: true, fields: ['goods_id', 'location_id'] },
      ],
    }
  );

  Stock.associate = (models) => {
    Stock.belongsTo(models.Goods, { foreignKey: 'goods_id', as: 'goods' });
    Stock.belongsTo(models.Location, { foreignKey: 'location_id', as: 'location' });
    Stock.hasMany(models.StockAdjustment, { foreignKey: 'stock_id', as: 'adjustments' });
  };

  return Stock;
};
