module.exports = (sequelize, DataTypes) => {
  const StockAdjustment = sequelize.define(
    'StockAdjustment',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      stock_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      adjustment_type: {
        // `set` has been removed — only traceable signed deltas are supported.
        // A `set` adjustment has no computable net delta and therefore cannot
        // participate in the period summary.  Existing `set` rows in the DB are
        // left untouched but no new ones can be created through the application.
        type: DataTypes.ENUM('add', 'subtract'),
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 4),
        allowNull: false,
        validate: { min: 0 },
      },
      reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      requested_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      reviewed_by: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      reviewed_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      review_note: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'stock_adjustments',
      timestamps: true,
    }
  );

  StockAdjustment.associate = (models) => {
    StockAdjustment.belongsTo(models.Stock, { foreignKey: 'stock_id', as: 'stock' });
    StockAdjustment.belongsTo(models.User, { foreignKey: 'requested_by', as: 'requester' });
    StockAdjustment.belongsTo(models.User, { foreignKey: 'reviewed_by', as: 'reviewer' });
  };

  return StockAdjustment;
};
