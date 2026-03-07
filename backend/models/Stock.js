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
      goodId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
      minQuantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'stocks',
      timestamps: true,
    }
  );

  Stock.associate = (models) => {
    Stock.belongsTo(models.Location, { foreignKey: 'locationId', as: 'location' });
    Stock.belongsTo(models.Good, { foreignKey: 'goodId', as: 'good' });
  };

  return Stock;
};
