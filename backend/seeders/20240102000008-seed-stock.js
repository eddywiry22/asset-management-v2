'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const productIds = [
      'PROD-ELEC-001',
      'PROD-ELEC-002',
      'PROD-ELEC-003',
      'PROD-ELEC-004',
      'PROD-OFFC-001',
      'PROD-OFFC-002',
      'PROD-OFFC-003',
    ];

    const goods = await queryInterface.sequelize.query(
      `SELECT id, product_id FROM goods WHERE product_id IN (${productIds.map((p) => `'${p}'`).join(',')})`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const locations = await queryInterface.sequelize.query(
      `SELECT id, name FROM locations WHERE name IN ('Main Warehouse', 'Secondary Warehouse')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const now = new Date();
    const rows = [];

    for (const location of locations) {
      for (const good of goods) {
        rows.push({
          goods_id: good.id,
          location_id: location.id,
          quantity: 30,
          last_updated_at: now,
        });
      }
    }

    if (rows.length) {
      await queryInterface.bulkInsert('stock', rows);
    }
  },

  async down(queryInterface, _Sequelize) {
    const goods = await queryInterface.sequelize.query(
      `SELECT id FROM goods WHERE product_id IN ('PROD-ELEC-001','PROD-ELEC-002','PROD-ELEC-003','PROD-ELEC-004','PROD-OFFC-001','PROD-OFFC-002','PROD-OFFC-003')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const locations = await queryInterface.sequelize.query(
      `SELECT id FROM locations WHERE name IN ('Main Warehouse', 'Secondary Warehouse')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const goodsIds = goods.map((g) => g.id);
    const locationIds = locations.map((l) => l.id);

    if (goodsIds.length && locationIds.length) {
      await queryInterface.bulkDelete('stock', {
        goods_id: goodsIds,
        location_id: locationIds,
      });
    }
  },
};
