'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const tables = (await queryInterface.showAllTables()).map((t) =>
      typeof t === 'string' ? t : t.tableName || t.table_name
    );

    const hasStock = tables.includes('stock');
    const hasStocks = tables.includes('stocks');
    const hasAdjustments = tables.includes('stock_adjustments');

    if (!hasAdjustments || !hasStock) {
      return;
    }

    // If both legacy and canonical stock tables exist, merge missing rows to canonical table.
    if (hasStocks) {
      await queryInterface.sequelize.query(`
        INSERT INTO stock (goods_id, location_id, quantity, last_updated_at)
        SELECT s.goods_id, s.location_id, s.quantity, COALESCE(s.last_updated_at, NOW())
        FROM stocks s
        LEFT JOIN stock c
          ON c.goods_id = s.goods_id
         AND c.location_id = s.location_id
        WHERE c.id IS NULL
      `);
    }

    // Remove any FK(s) currently bound to stock_adjustments.stock_id (name differs by environment).
    const [constraints] = await queryInterface.sequelize.query(`
      SELECT CONSTRAINT_NAME
      FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'stock_adjustments'
        AND COLUMN_NAME = 'stock_id'
        AND REFERENCED_TABLE_NAME IS NOT NULL
    `);

    for (const row of constraints) {
      await queryInterface.removeConstraint('stock_adjustments', row.CONSTRAINT_NAME).catch(() => {});
    }

    await queryInterface.addConstraint('stock_adjustments', {
      fields: ['stock_id'],
      type: 'foreign key',
      name: 'fk_stock_adjustments_stock_id_stock',
      references: {
        table: 'stock',
        field: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    });
  },

  async down(queryInterface) {
    const tables = (await queryInterface.showAllTables()).map((t) =>
      typeof t === 'string' ? t : t.tableName || t.table_name
    );

    if (!tables.includes('stock_adjustments')) {
      return;
    }

    await queryInterface
      .removeConstraint('stock_adjustments', 'fk_stock_adjustments_stock_id_stock')
      .catch(() => {});

    if (tables.includes('stocks')) {
      await queryInterface.addConstraint('stock_adjustments', {
        fields: ['stock_id'],
        type: 'foreign key',
        name: 'fk_stock_adjustments_stock_id_stocks',
        references: {
          table: 'stocks',
          field: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      });
    }
  },
};
