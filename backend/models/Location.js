module.exports = (sequelize, DataTypes) => {
  const Location = sequelize.define(
    'Location',
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
      code: {
        type: DataTypes.STRING(50),
        allowNull: false,
        unique: true,
        validate: { notEmpty: true },
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
    },
    {
      tableName: 'locations',
      timestamps: true,
    }
  );

  Location.associate = (models) => {
    Location.hasMany(models.Stock, { foreignKey: 'location_id', as: 'stocks' });
  };

  return Location;
};
