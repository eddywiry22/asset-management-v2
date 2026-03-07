module.exports = (sequelize, DataTypes) => {
  const Movement = sequelize.define(
    'Movement',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      type: {
        type: DataTypes.ENUM('in', 'out', 'transfer'),
        allowNull: false,
      },
      fromLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      toLocationId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
      goodId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'completed',
      },
      date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
      },
      notes: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      userId: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
      },
    },
    {
      tableName: 'movements',
      timestamps: true,
    }
  );

  Movement.associate = (models) => {
    Movement.belongsTo(models.Location, { foreignKey: 'fromLocationId', as: 'fromLocation' });
    Movement.belongsTo(models.Location, { foreignKey: 'toLocationId', as: 'toLocation' });
    Movement.belongsTo(models.Good, { foreignKey: 'goodId', as: 'good' });
    Movement.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return Movement;
};
