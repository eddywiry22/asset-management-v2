'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, _Sequelize) {
    const categories = await queryInterface.sequelize.query(
      `SELECT id, name FROM categories WHERE name IN ('Electronics', 'Office Supplies')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const categoryMap = Object.fromEntries(categories.map((c) => [c.name, c.id]));

    const vendors = await queryInterface.sequelize.query(
      `SELECT id, name FROM vendors WHERE name IN ('TechSupply Co.', 'OfficeWorld Distributors')`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    const vendorMap = Object.fromEntries(vendors.map((v) => [v.name, v.id]));

    const adminUser = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE email = 'warehouse.admin@example.com' LIMIT 1`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    const adminId = adminUser.length ? adminUser[0].id : null;
    const now = new Date();

    const rows = [
      {
        product_id: 'PROD-ELEC-001',
        name: 'Laptop – Business Series 14"',
        category: categoryMap['Electronics'],
        vendor: vendorMap['TechSupply Co.'],
        description: '14-inch business laptop with Intel Core i7, 16GB RAM, 512GB SSD.',
      },
      {
        product_id: 'PROD-ELEC-002',
        name: 'Wireless Keyboard & Mouse Combo',
        category: categoryMap['Electronics'],
        vendor: vendorMap['TechSupply Co.'],
        description: 'Ergonomic wireless keyboard and mouse combo with USB receiver.',
      },
      {
        product_id: 'PROD-ELEC-003',
        name: '24" Full HD Monitor',
        category: categoryMap['Electronics'],
        vendor: vendorMap['TechSupply Co.'],
        description: '24-inch Full HD IPS monitor with HDMI and DisplayPort inputs.',
      },
      {
        product_id: 'PROD-ELEC-004',
        name: 'USB-C Docking Station',
        category: categoryMap['Electronics'],
        vendor: vendorMap['TechSupply Co.'],
        description: 'Multi-port docking station for laptop workstations.',
      },
      {
        product_id: 'PROD-OFFC-001',
        name: 'A4 Copy Paper (Box of 5 Reams)',
        category: categoryMap['Office Supplies'],
        vendor: vendorMap['OfficeWorld Distributors'],
        description: '80gsm A4 copy paper, box contains 5 reams of 500 sheets each.',
      },
      {
        product_id: 'PROD-OFFC-002',
        name: 'Ballpoint Pen (Box of 50)',
        category: categoryMap['Office Supplies'],
        vendor: vendorMap['OfficeWorld Distributors'],
        description: 'Blue ink ballpoint pens, box of 50 units.',
      },
      {
        product_id: 'PROD-OFFC-003',
        name: 'Sticky Notes (Pack of 12)',
        category: categoryMap['Office Supplies'],
        vendor: vendorMap['OfficeWorld Distributors'],
        description: 'Assorted color sticky notes for office use.',
      },
    ];

    await queryInterface.bulkInsert('goods', rows.map((r) => ({
      ...r,
      status: 'ACTIVE',
      created_by: adminId,
      created_at: now,
      updated_by: adminId,
      updated_at: now,
    })));
  },

  async down(queryInterface, _Sequelize) {
    await queryInterface.bulkDelete('goods', {
      product_id: [
        'PROD-ELEC-001',
        'PROD-ELEC-002',
        'PROD-ELEC-003',
        'PROD-ELEC-004',
        'PROD-OFFC-001',
        'PROD-OFFC-002',
        'PROD-OFFC-003',
      ],
    });
  },
};
