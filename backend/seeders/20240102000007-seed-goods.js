'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const categories = await queryInterface.sequelize.query(
      `SELECT id, category FROM categories WHERE category IN ('Electronics', 'Office Supplies')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const categoryMap = {};
    categories.forEach((c) => { categoryMap[c.category] = c.id; });

    const vendors = await queryInterface.sequelize.query(
      `SELECT id, vendor FROM vendors WHERE vendor IN ('TechSupply Co.', 'OfficeWorld Distributors')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const vendorMap = {};
    vendors.forEach((v) => { vendorMap[v.vendor] = v.id; });

    const adminUser = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'warehouse.admin@example.com' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const adminId = adminUser.length ? adminUser[0].id : null;
    const now = new Date();

    await queryInterface.bulkInsert('goods', [
      {
        product_id: 'PROD-ELEC-001',
        name: 'Laptop – Business Series 14"',
        category: categoryMap['Electronics'],
        vendor: vendorMap['TechSupply Co.'],
        description: '14-inch business laptop with Intel Core i7, 16GB RAM, 512GB SSD.',
        status: 'ACTIVE',
        created_by: adminId,
        created_at: now,
        updated_by: adminId,
        updated_at: now,
      },
      {
        product_id: 'PROD-ELEC-002',
        name: 'Wireless Keyboard & Mouse Combo',
        category: categoryMap['Electronics'],
        vendor: vendorMap['TechSupply Co.'],
        description: 'Ergonomic wireless keyboard and mouse combo with USB receiver.',
        status: 'ACTIVE',
        created_by: adminId,
        created_at: now,
        updated_by: adminId,
        updated_at: now,
      },
      {
        product_id: 'PROD-ELEC-003',
        name: '24" Full HD Monitor',
        category: categoryMap['Electronics'],
        vendor: vendorMap['TechSupply Co.'],
        description: '24-inch Full HD IPS monitor with HDMI and DisplayPort inputs.',
        status: 'ACTIVE',
        created_by: adminId,
        created_at: now,
        updated_by: adminId,
        updated_at: now,
      },
      {
        product_id: 'PROD-OFFC-001',
        name: 'A4 Copy Paper (Box of 5 Reams)',
        category: categoryMap['Office Supplies'],
        vendor: vendorMap['OfficeWorld Distributors'],
        description: '80gsm A4 copy paper, box contains 5 reams of 500 sheets each.',
        status: 'ACTIVE',
        created_by: adminId,
        created_at: now,
        updated_by: adminId,
        updated_at: now,
      },
      {
        product_id: 'PROD-OFFC-002',
        name: 'Ballpoint Pen (Box of 50)',
        category: categoryMap['Office Supplies'],
        vendor: vendorMap['OfficeWorld Distributors'],
        description: 'Blue ink ballpoint pens, box of 50 units.',
        status: 'ACTIVE',
        created_by: adminId,
        created_at: now,
        updated_by: adminId,
        updated_at: now,
      },
    ]);
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('goods', {
      product_id: [
        'PROD-ELEC-001',
        'PROD-ELEC-002',
        'PROD-ELEC-003',
        'PROD-OFFC-001',
        'PROD-OFFC-002',
      ],
    });
  },
};
