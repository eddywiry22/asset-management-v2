module.exports = (sequelize, DataTypes) => {
  const Vendor = sequelize.define(
    'Vendor',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      vendor: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'vendors',
      timestamps: false,
    }
  );

  Vendor.associate = (models) => {
    Vendor.hasMany(models.Goods, { foreignKey: 'vendor', as: 'goods' });
  };

  return Vendor;
};
