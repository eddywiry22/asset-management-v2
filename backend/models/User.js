const bcrypt = require('bcrypt');

const SALT_ROUNDS = 12;

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.INTEGER.UNSIGNED,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING(255),
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM('admin', 'manager', 'viewer', 'warehouse_head', 'operator', 'requester'),
        allowNull: false,
        defaultValue: 'viewer',
      },
      location_id: {
        type: DataTypes.INTEGER.UNSIGNED,
        allowNull: true,
        defaultValue: null,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      lastLoginAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      timestamps: true,
      // Never return the password in JSON serialization
      defaultScope: {
        attributes: { exclude: ['password'] },
      },
      scopes: {
        withPassword: { attributes: {} },
      },
    }
  );

  // Hash password before create / update
  User.beforeCreate(async (user) => {
    user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
  });

  User.beforeUpdate(async (user) => {
    if (user.changed('password')) {
      user.password = await bcrypt.hash(user.password, SALT_ROUNDS);
    }
  });

  // Instance method – verify a plaintext password
  User.prototype.verifyPassword = async function (plaintext) {
    return bcrypt.compare(plaintext, this.password);
  };

  User.associate = (models) => {
    User.hasMany(models.MovementRequest, { foreignKey: 'requester_id', as: 'movementRequests' });
  };

  return User;
};
