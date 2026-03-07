'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const goods = await queryInterface.sequelize.query(
      `SELECT id, product_id FROM goods WHERE product_id IN ('PROD-ELEC-001', 'PROD-ELEC-002', 'PROD-ELEC-003', 'PROD-OFFC-001', 'PROD-OFFC-002')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const goodsMap = {};
    goods.forEach((g) => { goodsMap[g.product_id] = g.id; });

    const locations = await queryInterface.sequelize.query(
      `SELECT id, name FROM locations WHERE name IN ('Main Warehouse', 'Secondary Warehouse')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const locationMap = {};
    locations.forEach((l) => { locationMap[l.name] = l.id; });

    const now = new Date();

    await queryInterface.bulkInsert('stock', [
      // Main Warehouse stock
      {
        goods_id: goodsMap['PROD-ELEC-001'],
        location_id: locationMap['Main Warehouse'],
        quantity: 20,
        last_updated_at: now,
      },
      {
        goods_id: goodsMap['PROD-ELEC-002'],
        location_id: locationMap['Main Warehouse'],
        quantity: 50,
        last_updated_at: now,
      },
      {
        goods_id: goodsMap['PROD-ELEC-003'],
        location_id: locationMap['Main Warehouse'],
        quantity: 15,
        last_updated_at: now,
      },
      {
        goods_id: goodsMap['PROD-OFFC-001'],
        location_id: locationMap['Main Warehouse'],
        quantity: 100,
        last_updated_at: now,
      },
      {
        goods_id: goodsMap['PROD-OFFC-002'],
        location_id: locationMap['Main Warehouse'],
        quantity: 200,
        last_updated_at: now,
      },
      // Secondary Warehouse stock
      {
        goods_id: goodsMap['PROD-ELEC-001'],
        location_id: locationMap['Secondary Warehouse'],
        quantity: 10,
        last_updated_at: now,
      },
      {
        goods_id: goodsMap['PROD-ELEC-002'],
        location_id: locationMap['Secondary Warehouse'],
        quantity: 25,
        last_updated_at: now,
      },
      {
        goods_id: goodsMap['PROD-OFFC-001'],
        location_id: locationMap['Secondary Warehouse'],
        quantity: 60,
        last_updated_at: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    const goods = await queryInterface.sequelize.query(
      `SELECT id FROM goods WHERE product_id IN ('PROD-ELEC-001', 'PROD-ELEC-002', 'PROD-ELEC-003', 'PROD-OFFC-001', 'PROD-OFFC-002')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const goodsIds = goods.map((g) => g.id);

    if (goodsIds.length) {
      await queryInterface.bulkDelete('stock', { goods_id: goodsIds });
    }
  },
};
