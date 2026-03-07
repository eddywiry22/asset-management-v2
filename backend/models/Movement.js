module.exports = (sequelize, DataTypes) => {
  const Movement = sequelize.define(
    'Movement',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      asset_name: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true },
      },
      from_location: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true },
      },
      to_location: {
        type: DataTypes.STRING(150),
        allowNull: false,
        validate: { notEmpty: true },
      },
      purpose: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      status: {
        type: DataTypes.ENUM('pending', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'pending',
      },
      rejection_reason: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      requested_by_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: false,
      },
      approved_by_id: {
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
    Movement.belongsTo(models.User, { foreignKey: 'requested_by_id', as: 'requestedBy' });
    Movement.belongsTo(models.User, { foreignKey: 'approved_by_id', as: 'approvedBy' });
  };

  return Movement;
};
