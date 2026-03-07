module.exports = (sequelize, DataTypes) => {
  const MovementDetail = sequelize.define(
    'MovementDetail',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      movementHeaderId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      // Unified: references Goods (single source of truth for goods/products)
      goodsId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
        field: 'goods_id',
      },
      quantity: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: false,
      },
      originQtyBefore: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
      },
      originQtyAfter: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
      },
      destinationQtyBefore: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
      },
      destinationQtyAfter: {
        type: DataTypes.DECIMAL(15, 4),
        allowNull: true,
      },
    },
    {
      tableName: 'movement_details',
      timestamps: true,
    }
  );

  MovementDetail.associate = (models) => {
    MovementDetail.belongsTo(models.MovementHeader, { foreignKey: 'movementHeaderId', as: 'header' });
    MovementDetail.belongsTo(models.Goods, { foreignKey: 'goodsId', as: 'goods' });
  };

  return MovementDetail;
};
