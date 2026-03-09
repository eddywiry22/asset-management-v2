'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    const [stockTables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'stock'");
    const [stocksTables] = await queryInterface.sequelize.query("SHOW TABLES LIKE 'stocks'");

    const hasStock = stockTables.length > 0;
    const hasStocks = stocksTables.length > 0;

    if (!hasStock && hasStocks) {
      await queryInterface.sequelize.query('RENAME TABLE stocks TO stock');
      return;
    }

    if (hasStock && hasStocks) {
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
  },

  async down() {
    // no-op: reconciliation migration is intentionally irreversible
  },
};
