module.exports = (sequelize, DataTypes) => {
  const Goods = sequelize.define(
    'Goods',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: { notEmpty: true },
      },
      sku: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      unit: {
        type: DataTypes.STRING(50),
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

  Goods.associate = (models) => {
    Goods.hasMany(models.Stock, { foreignKey: 'goods_id', as: 'stocks' });
  };

  return Goods;
};
