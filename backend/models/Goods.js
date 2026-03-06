module.exports = (sequelize, DataTypes) => {
  const Goods = sequelize.define(
    'Goods',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      product_id: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        validate: {
          notEmpty: true,
        },
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        validate: {
          notEmpty: true,
          len: [1, 200],
        },
      },
      category: {
        type: DataTypes.STRING(100),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      vendor: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
        validate: {
          isIn: [['ACTIVE', 'INACTIVE']],
        },
      },
    },
    {
      tableName: 'goods',
      timestamps: true,
    }
  );

  Goods.associate = (_models) => {
    // e.g. Goods.hasMany(models.MovementRequest, { foreignKey: 'goodsId' });
  };

  return Goods;
};
