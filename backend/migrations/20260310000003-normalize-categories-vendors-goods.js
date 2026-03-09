'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // ---------------------------------------------------------------------
    // categories normalization
    // ---------------------------------------------------------------------
    const categories = await queryInterface.describeTable('categories');

    if (!categories.name && categories.category) {
      await queryInterface.renameColumn('categories', 'category', 'name');
    }

    if (!categories.isActive) {
      await queryInterface.addColumn('categories', 'isActive', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (!categories.createdAt) {
      await queryInterface.addColumn('categories', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }

    if (!categories.updatedAt) {
      await queryInterface.addColumn('categories', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }

    await queryInterface.addIndex('categories', ['name'], {
      unique: true,
      name: 'categories_name_unique',
    }).catch(() => {});

    // ---------------------------------------------------------------------
    // vendors normalization
    // ---------------------------------------------------------------------
    const vendors = await queryInterface.describeTable('vendors');

    if (!vendors.name && vendors.vendor) {
      await queryInterface.renameColumn('vendors', 'vendor', 'name');
    }

    const vendorColumns = [
      ['contactPerson', Sequelize.STRING(100)],
      ['email', Sequelize.STRING(150)],
      ['phone', Sequelize.STRING(20)],
      ['address', Sequelize.TEXT],
    ];

    for (const [col, type] of vendorColumns) {
      if (!vendors[col]) {
        await queryInterface.addColumn('vendors', col, {
          type,
          allowNull: true,
        });
      }
    }

    if (!vendors.isActive) {
      await queryInterface.addColumn('vendors', 'isActive', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      });
    }

    if (!vendors.createdAt) {
      await queryInterface.addColumn('vendors', 'createdAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }

    if (!vendors.updatedAt) {
      await queryInterface.addColumn('vendors', 'updatedAt', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
    }

    await queryInterface.addIndex('vendors', ['name'], {
      unique: true,
      name: 'vendors_name_unique',
    }).catch(() => {});

    // ---------------------------------------------------------------------
    // goods normalization
    // ---------------------------------------------------------------------
    const goods = await queryInterface.describeTable('goods');

    if (!goods.product_id) {
      await queryInterface.addColumn('goods', 'product_id', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });

      // Backfill from legacy sku when available.
      if (goods.sku) {
        await queryInterface.sequelize.query(`
          UPDATE goods
             SET product_id = sku
           WHERE product_id IS NULL AND sku IS NOT NULL
        `);
      }

      await queryInterface.changeColumn('goods', 'product_id', {
        type: Sequelize.STRING(100),
        allowNull: false,
      });
    }

    if (!goods.status) {
      await queryInterface.addColumn('goods', 'status', {
        type: Sequelize.ENUM('ACTIVE', 'INACTIVE'),
        allowNull: false,
        defaultValue: 'ACTIVE',
      });

      if (goods.isActive) {
        await queryInterface.sequelize.query(`
          UPDATE goods
             SET status = CASE WHEN isActive = 1 THEN 'ACTIVE' ELSE 'INACTIVE' END
        `);
      }
    }

    if (!goods.created_by) {
      await queryInterface.addColumn('goods', 'created_by', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }

    if (!goods.updated_by) {
      await queryInterface.addColumn('goods', 'updated_by', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }

    if (!goods.created_at) {
      await queryInterface.addColumn('goods', 'created_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
      if (goods.createdAt) {
        await queryInterface.sequelize.query('UPDATE goods SET created_at = createdAt WHERE created_at IS NULL');
      }
    }

    if (!goods.updated_at) {
      await queryInterface.addColumn('goods', 'updated_at', {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      });
      if (goods.updatedAt) {
        await queryInterface.sequelize.query('UPDATE goods SET updated_at = updatedAt WHERE updated_at IS NULL');
      }
    }

    // Normalize category and vendor to canonical integer FK-shaped columns.
    const goodsRef = await queryInterface.describeTable('goods');

    if (goodsRef.category && !String(goodsRef.category.type).toLowerCase().includes('int')) {
      await queryInterface.addColumn('goods', 'category_tmp', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
      await queryInterface.sequelize.query(`
        UPDATE goods
           SET category_tmp = CASE
             WHEN category REGEXP '^[0-9]+$' THEN CAST(category AS UNSIGNED)
             ELSE NULL
           END
      `);
      await queryInterface.removeColumn('goods', 'category');
      await queryInterface.renameColumn('goods', 'category_tmp', 'category');
    }

    if (!goodsRef.category) {
      await queryInterface.addColumn('goods', 'category', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }

    if (goodsRef.vendor && !String(goodsRef.vendor.type).toLowerCase().includes('int')) {
      await queryInterface.addColumn('goods', 'vendor_tmp', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
      await queryInterface.sequelize.query(`
        UPDATE goods
           SET vendor_tmp = CASE
             WHEN vendor REGEXP '^[0-9]+$' THEN CAST(vendor AS UNSIGNED)
             ELSE NULL
           END
      `);
      await queryInterface.removeColumn('goods', 'vendor');
      await queryInterface.renameColumn('goods', 'vendor_tmp', 'vendor');
    }

    if (!goodsRef.vendor) {
      await queryInterface.addColumn('goods', 'vendor', {
        type: Sequelize.INTEGER.UNSIGNED,
        allowNull: true,
      });
    }

    await queryInterface.addIndex('goods', ['product_id'], {
      unique: true,
      name: 'goods_product_id_unique',
    }).catch(() => {});
  },

  async down() {
    // no-op: this is a one-way normalization migration
  },
};
