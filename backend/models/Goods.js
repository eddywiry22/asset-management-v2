module.exports = (sequelize, DataTypes) => {
  const Goods = sequelize.define(
    'Goods',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      productId: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
        field: 'product_id',
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      category: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      vendor: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      },
      createdBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'created_by',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'created_at',
      },
      updatedBy: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        field: 'updated_by',
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        field: 'updated_at',
      },
    },
    {
      tableName: 'goods',
      timestamps: true,
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      // BUG-15: defaultScope ensures that all plain Goods.findAll() / findOne()
      // calls exclude INACTIVE goods automatically, matching the business rule
      // that inactive goods must not be selectable in movement requests.
      // Use Goods.unscoped() or Goods.scope('withInactive') when admin access
      // to all goods is explicitly required.
      paranoid: true,
      deletedAt: 'deleted_at',
      defaultScope: {
        where: { status: 'ACTIVE' },
      },
      scopes: {
        withInactive: {},
      },
    }
  );

  Goods.associate = (models) => {
    Goods.belongsTo(models.Category, { foreignKey: 'category', as: 'categoryInfo' });
    Goods.belongsTo(models.Vendor, { foreignKey: 'vendor', as: 'vendorInfo' });
    Goods.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
    Goods.belongsTo(models.User, { foreignKey: 'updatedBy', as: 'updater' });
    Goods.hasMany(models.Stock, { foreignKey: 'goodsId', as: 'stock' });
    // MovementDetail references Goods as the single source of truth for goods/products
    Goods.hasMany(models.MovementDetail, { foreignKey: 'goodsId', as: 'movementDetails' });
  };

  return Goods;
};
