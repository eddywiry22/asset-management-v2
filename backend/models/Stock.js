module.exports = (sequelize, DataTypes) => {
  const Stock = sequelize.define(
    'Stock',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      locationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      itemId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
        defaultValue: 0,
        validate: { min: 0 },
      },
    },
    {
      tableName: 'stocks',
      timestamps: true,
      indexes: [{ unique: true, fields: ['locationId', 'itemId'] }],
    }
  );

  Stock.associate = (models) => {
    Stock.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
    Stock.belongsTo(models.Item, { foreignKey: 'itemId', as: 'item' });
  };

  return Stock;
};
