'use strict';

/**
 * Warehouse Operator Workflow — Unit Test Suite
 *
 * Covers the 8 scenarios from simulation-test.md:
 *  1. Warehouse operator creates movement request
 *  2. Warehouse head approves request
 *  3. Destination operator approves request
 *  4. Movement finalized and stock updated
 *  5. Movement rejected with reason
 *  6. Duplicate movement request attempted
 *  7. User with inactive status attempts login
 *  8. Goods with inactive status attempted selection
 *
 * All database interactions are mocked so no live DB connection is required.
 */

// ---------------------------------------------------------------------------
// Mock: auditLogService — fire-and-forget, no assertions needed here
// ---------------------------------------------------------------------------
jest.mock('../services/auditLogService', () => ({
  createAuditLog: jest.fn().mockResolvedValue(undefined),
}));

// ---------------------------------------------------------------------------
// Mock: ../models — provide fake Sequelize model stubs
// ---------------------------------------------------------------------------
jest.mock('../models', () => {
  const mockTransaction = {
    LOCK: { UPDATE: 'UPDATE' },
  };

  // sequelize.transaction(cb) — just call the callback with the fake transaction
  const sequelize = {
    transaction: jest.fn(async (cb) => cb(mockTransaction)),
  };

  const Op = {
    in: Symbol('in'),
    or: Symbol('or'),
  };

  const makeModel = () => ({
    findByPk: jest.fn(),
    findOne: jest.fn(),
    findAll: jest.fn(),
    findAndCountAll: jest.fn(),
    create: jest.fn(),
    bulkCreate: jest.fn(),
    count: jest.fn(),
    update: jest.fn(),
    unscoped: jest.fn(function () { return this; }),
    scope: jest.fn(function () { return this; }),
  });

  return {
    sequelize,
    Op,
    MovementHeader: makeModel(),
    MovementDetail: makeModel(),
    Location: makeModel(),
    Goods: makeModel(),
    Stock: makeModel(),
    User: makeModel(),
    AuditLog: makeModel(),
  };
});

// ---------------------------------------------------------------------------
// Mock: bcrypt — speed up hash comparisons in unit tests
// ---------------------------------------------------------------------------
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
  hash: jest.fn(),
  genSalt: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Mock: ../utils/jwt — avoids needing real JWT secrets
// ---------------------------------------------------------------------------
jest.mock('../utils/jwt', () => ({
  signToken: jest.fn(() => 'mock-access-token'),
  signRefreshToken: jest.fn(() => 'mock-refresh-token'),
  verifyToken: jest.fn(),
}));

// ---------------------------------------------------------------------------
// Mock: ../config/jwt — required indirectly by some paths
// ---------------------------------------------------------------------------
jest.mock('../config/jwt', () => ({
  secret: 'test-secret',
  expiresIn: '15m',
  refreshSecret: 'test-refresh-secret',
  refreshExpiresIn: '7d',
}));

// ---------------------------------------------------------------------------
// Import services under test AFTER mocks are set up
// ---------------------------------------------------------------------------
const movementService = require('../services/movementService');
const authService = require('../services/authService');
const {
  sequelize,
  MovementHeader,
  MovementDetail,
  Location,
  Goods,
  Stock,
  User,
} = require('../models');
const bcrypt = require('bcrypt');

// ---------------------------------------------------------------------------
// Test data helpers
// ---------------------------------------------------------------------------

const makeLocation = (overrides = {}) => ({
  id: 1,
  name: 'Warehouse A',
  status: 'ACTIVE',
  ...overrides,
});

const makeGoods = (overrides = {}) => ({
  id: 10,
  name: 'Widget X',
  productId: 'WX-001',
  status: 'ACTIVE',
  ...overrides,
});

const makeStock = (overrides = {}) => ({
  id: 100,
  goodsId: 10,
  locationId: 1,
  quantity: 50,
  lastUpdatedAt: new Date(),
  update: jest.fn(async function (data) {
    Object.assign(this, data);
    return this;
  }),
  ...overrides,
});

const makeMovementHeader = (overrides = {}) => ({
  id: 1,
  movementNumber: 'MV-202603-00001',
  originLocationId: 1,
  destinationLocationId: 2,
  requestedById: 5,
  status: 'PENDING_HEAD_APPROVAL',
  notes: null,
  rejectionReason: null,
  details: [],
  update: jest.fn(async function (data) {
    Object.assign(this, data);
    return this;
  }),
  ...overrides,
});

/** Reset all model mocks between tests */
beforeEach(() => {
  // resetAllMocks clears both mock.calls AND queued mockResolvedValueOnce implementations,
  // preventing state leakage between tests.
  jest.resetAllMocks();

  // Default: transaction callback is a pass-through
  sequelize.transaction.mockImplementation(async (cb) => cb({ LOCK: { UPDATE: 'UPDATE' } }));

  // Default getMovement stub — returns a fully-loaded movement
  MovementHeader.findByPk.mockImplementation(async (id, opts) => {
    // When called with include (full load), return the enriched version
    if (opts && opts.include) {
      return makeMovementHeader({ id });
    }
    return makeMovementHeader({ id });
  });
});

// ===========================================================================
// Scenario 1 — Warehouse Operator Creates Movement Request
// ===========================================================================
describe('Scenario 1 — Warehouse Operator Creates Movement Request', () => {
  const operatorId = 5;
  const data = {
    originLocationId: 1,
    destinationLocationId: 2,
    items: [{ goodsId: 10, quantity: 5 }],
    notes: 'Replenishment run',
  };

  beforeEach(() => {
    Location.findByPk
      .mockResolvedValueOnce(makeLocation({ id: 1 }))   // origin
      .mockResolvedValueOnce(makeLocation({ id: 2 }));  // destination

    Goods.findByPk.mockResolvedValue(makeGoods());
    Goods.unscoped.mockReturnValue(Goods);

    // Origin stock exists with enough quantity
    Stock.findOne
      .mockResolvedValueOnce(makeStock({ locationId: 1, quantity: 50 }))  // origin qty check
      .mockResolvedValueOnce(makeStock({ locationId: 2, quantity: 0 }))   // dest stock check
      .mockResolvedValueOnce(null);                                         // duplicate check inner findAll

    MovementHeader.count.mockResolvedValue(0);
    MovementHeader.findAll.mockResolvedValue([]);  // no duplicates

    const createdHeader = makeMovementHeader({ id: 1, requestedById: operatorId });
    MovementHeader.create.mockResolvedValue(createdHeader);
    MovementDetail.bulkCreate.mockResolvedValue([]);
  });

  test('creates movement with status PENDING_HEAD_APPROVAL', async () => {
    const { movement } = await movementService.createMovement(operatorId, data);

    expect(MovementHeader.create).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING_HEAD_APPROVAL',
        originLocationId: 1,
        destinationLocationId: 2,
        requestedById: operatorId,
      }),
      expect.any(Object) // transaction option
    );
    expect(movement).toBeDefined();
  });

  test('rejects if origin and destination are the same location', async () => {
    await expect(
      movementService.createMovement(operatorId, { ...data, destinationLocationId: 1 })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rejects if origin location does not exist', async () => {
    Location.findByPk.mockReset();
    Location.findByPk.mockResolvedValueOnce(null);  // origin not found

    await expect(movementService.createMovement(operatorId, data)).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  test('rejects if no items provided', async () => {
    await expect(
      movementService.createMovement(operatorId, { ...data, items: [] })
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rejects if origin stock is insufficient', async () => {
    Stock.findOne.mockReset();
    Stock.findOne.mockResolvedValueOnce(makeStock({ quantity: 2 })); // only 2 in stock

    await expect(
      movementService.createMovement(operatorId, {
        ...data,
        items: [{ goodsId: 10, quantity: 10 }], // requesting 10
      })
    ).rejects.toMatchObject({ statusCode: 400 });
  });
});

// ===========================================================================
// Scenario 2 — Warehouse Head Approves Request
// ===========================================================================
describe('Scenario 2 — Warehouse Head Approves Request', () => {
  const headUserId = 20;
  const movementId = 1;

  test('transitions status to PENDING_DESTINATION_APPROVAL', async () => {
    const movement = makeMovementHeader({
      id: movementId,
      status: 'PENDING_HEAD_APPROVAL',
      requestedById: 5, // different user — not self-approval
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    const result = await movementService.approveByHead(headUserId, movementId);

    expect(movement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'PENDING_DESTINATION_APPROVAL',
        headApprovedById: headUserId,
      })
    );
    expect(result).toBeDefined();
  });

  test('rejects if movement is not in PENDING_HEAD_APPROVAL status', async () => {
    const movement = makeMovementHeader({ status: 'PENDING_DESTINATION_APPROVAL' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(movementService.approveByHead(headUserId, movementId)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('rejects self-approval — requester cannot approve their own request', async () => {
    const movement = makeMovementHeader({
      status: 'PENDING_HEAD_APPROVAL',
      requestedById: headUserId, // same user
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(movementService.approveByHead(headUserId, movementId)).rejects.toMatchObject({
      statusCode: 403,
    });
  });

  test('rejects if movement is not found', async () => {
    MovementHeader.findByPk.mockResolvedValue(null);

    await expect(movementService.approveByHead(headUserId, movementId)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});

// ===========================================================================
// Scenario 3 — Destination Operator Approves Request
// ===========================================================================
describe('Scenario 3 — Destination Operator Approves Request', () => {
  const destOperatorId = 30;
  const destLocationId = 2;
  const movementId = 1;

  test('transitions status to APPROVED_READY_FOR_FINALIZATION', async () => {
    const movement = makeMovementHeader({
      id: movementId,
      status: 'PENDING_DESTINATION_APPROVAL',
      destinationLocationId: destLocationId,
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    const result = await movementService.approveByDestination(
      destOperatorId,
      movementId,
      destLocationId,        // userLocationId matches destination
      'destination_operator'
    );

    expect(movement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'APPROVED_READY_FOR_FINALIZATION',
        destApprovedById: destOperatorId,
      })
    );
    expect(result).toBeDefined();
  });

  test('rejects if movement is not in PENDING_DESTINATION_APPROVAL status', async () => {
    const movement = makeMovementHeader({ status: 'PENDING_HEAD_APPROVAL' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.approveByDestination(destOperatorId, movementId, destLocationId, 'destination_operator')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rejects if destination_operator locationId does not match destination', async () => {
    const movement = makeMovementHeader({
      status: 'PENDING_DESTINATION_APPROVAL',
      destinationLocationId: 99, // different location
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.approveByDestination(destOperatorId, movementId, destLocationId, 'destination_operator')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('admin can approve at destination regardless of locationId', async () => {
    const movement = makeMovementHeader({
      id: movementId,
      status: 'PENDING_DESTINATION_APPROVAL',
      destinationLocationId: 99,
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    const result = await movementService.approveByDestination(
      1,        // admin userId
      movementId,
      null,     // admin has no locationId
      'admin'
    );

    expect(movement.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'APPROVED_READY_FOR_FINALIZATION' })
    );
    expect(result).toBeDefined();
  });
});

// ===========================================================================
// Scenario 4 — Movement Finalized and Stock Updated
// ===========================================================================
describe('Scenario 4 — Movement Finalized and Stock Updated', () => {
  const operatorId = 5;
  const movementId = 1;

  const originStock = makeStock({ locationId: 1, quantity: 50, goodsId: 10 });
  const destStock = makeStock({ locationId: 2, quantity: 10, goodsId: 10 });

  beforeEach(() => {
    const movement = makeMovementHeader({
      id: movementId,
      status: 'APPROVED_READY_FOR_FINALIZATION',
      requestedById: operatorId,
      originLocationId: 1,
      destinationLocationId: 2,
      details: [{ goodsId: 10, quantity: 5 }],
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    // Stock.findOne returns origin then destination
    Stock.findOne
      .mockResolvedValueOnce(originStock)  // origin lock
      .mockResolvedValueOnce(destStock);   // dest lock
  });

  test('deducts from origin and adds to destination atomically', async () => {
    const result = await movementService.finalizeMovement(operatorId, movementId, 'warehouse_operator');

    // Origin should have been decremented: 50 - 5 = 45
    expect(originStock.update).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 45 }),
      expect.any(Object)
    );

    // Destination should have been incremented: 10 + 5 = 15
    expect(destStock.update).toHaveBeenCalledWith(
      expect.objectContaining({ quantity: 15 }),
      expect.any(Object)
    );

    expect(result).toBeDefined();
  });

  test('transitions movement status to COMPLETED', async () => {
    const movement = makeMovementHeader({
      id: movementId,
      status: 'APPROVED_READY_FOR_FINALIZATION',
      requestedById: operatorId,
      details: [{ goodsId: 10, quantity: 5 }],
    });
    MovementHeader.findByPk.mockResolvedValue(movement);
    Stock.findOne
      .mockResolvedValueOnce(originStock)
      .mockResolvedValueOnce(destStock);

    await movementService.finalizeMovement(operatorId, movementId, 'warehouse_operator');

    expect(movement.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'COMPLETED' }),
      expect.any(Object)
    );
  });

  test('rejects finalization if movement is not in APPROVED_READY_FOR_FINALIZATION', async () => {
    const movement = makeMovementHeader({ status: 'PENDING_HEAD_APPROVAL' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.finalizeMovement(operatorId, movementId, 'warehouse_operator')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('rejects if stock at origin has become insufficient at finalization time', async () => {
    const lowOriginStock = makeStock({ locationId: 1, quantity: 2, goodsId: 10 }); // only 2 left
    const destStockLocal = makeStock({ locationId: 2, quantity: 10, goodsId: 10 });

    // Reset so describe-level beforeEach queue doesn't interfere
    Stock.findOne.mockReset();
    Stock.findOne
      .mockResolvedValueOnce(lowOriginStock) // origin stock — only 2 available
      .mockResolvedValueOnce(destStockLocal);

    const movement = makeMovementHeader({
      id: movementId,
      status: 'APPROVED_READY_FOR_FINALIZATION',
      requestedById: operatorId,
      details: [{ goodsId: 10, quantity: 10 }], // requesting 10 but only 2 available
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.finalizeMovement(operatorId, movementId, 'warehouse_operator')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('non-owner warehouse_operator cannot finalize another operator\'s movement', async () => {
    const movement = makeMovementHeader({
      status: 'APPROVED_READY_FOR_FINALIZATION',
      requestedById: 999, // different operator
      details: [{ goodsId: 10, quantity: 5 }],
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.finalizeMovement(operatorId, movementId, 'warehouse_operator')
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ===========================================================================
// Scenario 5 — Movement Rejected with Reason
// ===========================================================================
describe('Scenario 5 — Movement Rejected with Reason', () => {
  const headUserId = 20;
  const movementId = 1;
  const reason = 'Insufficient justification for the transfer';

  test('warehouse_head can reject a PENDING_HEAD_APPROVAL movement', async () => {
    const movement = makeMovementHeader({
      id: movementId,
      status: 'PENDING_HEAD_APPROVAL',
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    const result = await movementService.rejectMovement(headUserId, movementId, reason, 'warehouse_head');

    expect(movement.update).toHaveBeenCalledWith(
      expect.objectContaining({
        status: 'REJECTED',
        rejectionReason: reason,
        rejectedById: headUserId,
      })
    );
    expect(result).toBeDefined();
  });

  test('destination_operator can reject a PENDING_DESTINATION_APPROVAL movement', async () => {
    const destUserId = 30;
    const movement = makeMovementHeader({
      id: movementId,
      status: 'PENDING_DESTINATION_APPROVAL',
    });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await movementService.rejectMovement(destUserId, movementId, reason, 'destination_operator');

    expect(movement.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'REJECTED', rejectionReason: reason })
    );
  });

  test('rejection stores the reason on the movement record', async () => {
    const movement = makeMovementHeader({ status: 'PENDING_HEAD_APPROVAL' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await movementService.rejectMovement(headUserId, movementId, reason, 'warehouse_head');

    const updateCall = movement.update.mock.calls[0][0];
    expect(updateCall.rejectionReason).toBe(reason);
  });

  test('cannot reject an already COMPLETED movement', async () => {
    const movement = makeMovementHeader({ status: 'COMPLETED' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.rejectMovement(headUserId, movementId, reason, 'warehouse_head')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('cannot reject an already REJECTED movement', async () => {
    const movement = makeMovementHeader({ status: 'REJECTED' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.rejectMovement(headUserId, movementId, reason, 'warehouse_head')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('cannot reject a movement that is APPROVED_READY_FOR_FINALIZATION', async () => {
    const movement = makeMovementHeader({ status: 'APPROVED_READY_FOR_FINALIZATION' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.rejectMovement(headUserId, movementId, reason, 'warehouse_head')
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('warehouse_head cannot reject a movement at PENDING_DESTINATION_APPROVAL stage', async () => {
    const movement = makeMovementHeader({ status: 'PENDING_DESTINATION_APPROVAL' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.rejectMovement(headUserId, movementId, reason, 'warehouse_head')
    ).rejects.toMatchObject({ statusCode: 403 });
  });

  test('destination_operator cannot reject a movement at PENDING_HEAD_APPROVAL stage', async () => {
    const destUserId = 30;
    const movement = makeMovementHeader({ status: 'PENDING_HEAD_APPROVAL' });
    MovementHeader.findByPk.mockResolvedValue(movement);

    await expect(
      movementService.rejectMovement(destUserId, movementId, reason, 'destination_operator')
    ).rejects.toMatchObject({ statusCode: 403 });
  });
});

// ===========================================================================
// Scenario 6 — Duplicate Movement Request Attempted
// ===========================================================================
describe('Scenario 6 — Duplicate Movement Request Attempted', () => {
  const operatorId = 5;
  const data = {
    originLocationId: 1,
    destinationLocationId: 2,
    items: [{ goodsId: 10, quantity: 5 }],
  };

  beforeEach(() => {
    Location.findByPk
      .mockResolvedValueOnce(makeLocation({ id: 1 }))
      .mockResolvedValueOnce(makeLocation({ id: 2 }));

    Goods.findByPk.mockResolvedValue(makeGoods());
    Goods.unscoped.mockReturnValue(Goods);

    Stock.findOne
      .mockResolvedValueOnce(makeStock({ quantity: 50 }))  // origin stock check
      .mockResolvedValueOnce(makeStock({ locationId: 2 })); // dest stock check

    MovementHeader.count.mockResolvedValue(1);
  });

  test('returns 409 when an active duplicate movement already exists', async () => {
    // Duplicate exists: same origin, destination, and goods
    const existingMovement = makeMovementHeader({
      id: 99,
      movementNumber: 'MV-202603-00099',
      status: 'PENDING_HEAD_APPROVAL',
      details: [{ goodsId: 10 }],
    });
    MovementHeader.findAll.mockResolvedValue([existingMovement]);

    await expect(movementService.createMovement(operatorId, data)).rejects.toMatchObject({
      statusCode: 409,
    });
  });

  test('duplicate check is quantity-agnostic — same goods at different qty is still a duplicate', async () => {
    const existingMovement = makeMovementHeader({
      id: 99,
      status: 'PENDING_HEAD_APPROVAL',
      details: [{ goodsId: 10 }], // same goods, regardless of qty
    });
    MovementHeader.findAll.mockResolvedValue([existingMovement]);

    // Provide enough stock so the stock-check passes and we reach the duplicate check
    Stock.findOne.mockReset();
    Stock.findOne
      .mockResolvedValueOnce(makeStock({ quantity: 500 }))  // origin: 500 >= 100 ✓
      .mockResolvedValueOnce(makeStock({ locationId: 2 })); // dest stock exists

    // Request the same goods at a DIFFERENT quantity — should still be a duplicate
    await expect(
      movementService.createMovement(operatorId, {
        ...data,
        items: [{ goodsId: 10, quantity: 100 }],
      })
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  test('allows creation when no active movement for the same route/goods exists', async () => {
    // No duplicates
    MovementHeader.findAll.mockResolvedValue([]);

    const createdHeader = makeMovementHeader({ id: 1, requestedById: operatorId });
    MovementHeader.create.mockResolvedValue(createdHeader);
    MovementDetail.bulkCreate.mockResolvedValue([]);

    const { movement } = await movementService.createMovement(operatorId, data);
    expect(movement).toBeDefined();
    expect(MovementHeader.create).toHaveBeenCalled();
  });
});

// ===========================================================================
// Scenario 7 — User with Inactive Status Attempts Login
// ===========================================================================
describe('Scenario 7 — User with Inactive Status Attempts Login', () => {
  const email = 'operator@example.com';
  const password = 'secret123';

  test('rejects login for a user with status=INACTIVE', async () => {
    const inactiveUser = {
      id: 5,
      name: 'John Doe',
      email,
      role: 'warehouse_operator',
      isActive: false,
      status: 'INACTIVE',
      verifyPassword: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(undefined),
    };

    User.scope.mockReturnValue(User);
    User.findOne.mockResolvedValue(inactiveUser);
    bcrypt.compare.mockResolvedValue(true);

    await expect(authService.login(email, password)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('rejects login when isActive=false even if status=ACTIVE', async () => {
    // Desync scenario: status says ACTIVE but isActive boolean is false
    const desynced = {
      id: 5,
      email,
      role: 'warehouse_operator',
      isActive: false,
      status: 'ACTIVE',
      verifyPassword: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(undefined),
    };

    User.scope.mockReturnValue(User);
    User.findOne.mockResolvedValue(desynced);

    await expect(authService.login(email, password)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('rejects login when status=INACTIVE even if isActive=true', async () => {
    // Desync scenario: isActive is true but status says INACTIVE
    const desynced = {
      id: 5,
      email,
      role: 'warehouse_operator',
      isActive: true,
      status: 'INACTIVE',
      verifyPassword: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(undefined),
    };

    User.scope.mockReturnValue(User);
    User.findOne.mockResolvedValue(desynced);

    await expect(authService.login(email, password)).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('succeeds for an active user with correct password', async () => {
    const activeUser = {
      id: 5,
      name: 'John Doe',
      email,
      role: 'warehouse_operator',
      isActive: true,
      status: 'ACTIVE',
      verifyPassword: jest.fn().mockResolvedValue(true),
      update: jest.fn().mockResolvedValue(undefined),
    };

    User.scope.mockReturnValue(User);
    User.findOne.mockResolvedValue(activeUser);

    const result = await authService.login(email, password);
    expect(result).toHaveProperty('accessToken');
    expect(result).toHaveProperty('user');
  });

  test('rejects login with wrong password even for an active user', async () => {
    const activeUser = {
      id: 5,
      email,
      isActive: true,
      status: 'ACTIVE',
      verifyPassword: jest.fn().mockResolvedValue(false), // wrong password
      update: jest.fn(),
    };

    User.scope.mockReturnValue(User);
    User.findOne.mockResolvedValue(activeUser);

    await expect(authService.login(email, 'wrongpassword')).rejects.toMatchObject({
      statusCode: 401,
    });
  });
});

// ===========================================================================
// Scenario 8 — Goods with Inactive Status Attempted Selection
// ===========================================================================
describe('Scenario 8 — Goods with Inactive Status Attempted Selection', () => {
  const operatorId = 5;
  const data = {
    originLocationId: 1,
    destinationLocationId: 2,
    items: [{ goodsId: 10, quantity: 5 }],
  };

  beforeEach(() => {
    Location.findByPk
      .mockResolvedValueOnce(makeLocation({ id: 1 }))
      .mockResolvedValueOnce(makeLocation({ id: 2 }));
  });

  test('rejects movement creation when goods status is INACTIVE', async () => {
    const inactiveGoods = makeGoods({ status: 'INACTIVE' });
    Goods.findByPk.mockResolvedValue(inactiveGoods);
    Goods.unscoped.mockReturnValue(Goods);

    await expect(movementService.createMovement(operatorId, data)).rejects.toMatchObject({
      statusCode: 400,
    });
  });

  test('rejects preview when goods status is INACTIVE', async () => {
    const inactiveGoods = makeGoods({ status: 'INACTIVE', name: 'Discontinued Part' });

    // previewMovement uses Goods.unscoped().findByPk
    const unscopedGoods = { findByPk: jest.fn().mockResolvedValue(inactiveGoods) };
    Goods.unscoped.mockReturnValue(unscopedGoods);

    await expect(
      movementService.previewMovement(1, 2, [{ goodsId: 10, quantity: 5 }])
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  test('allows selection of ACTIVE goods in movement creation', async () => {
    const activeGoods = makeGoods({ status: 'ACTIVE' });
    Goods.findByPk.mockResolvedValue(activeGoods);
    Goods.unscoped.mockReturnValue(Goods);

    Stock.findOne
      .mockResolvedValueOnce(makeStock({ quantity: 20 }))  // origin stock
      .mockResolvedValueOnce(makeStock({ locationId: 2 })); // dest stock check

    MovementHeader.count.mockResolvedValue(0);
    MovementHeader.findAll.mockResolvedValue([]);

    const createdHeader = makeMovementHeader({ id: 1, requestedById: operatorId });
    MovementHeader.create.mockResolvedValue(createdHeader);
    MovementDetail.bulkCreate.mockResolvedValue([]);

    const { movement } = await movementService.createMovement(operatorId, data);
    expect(movement).toBeDefined();
  });

  test('rejects if goods does not exist (null response)', async () => {
    Goods.findByPk.mockResolvedValue(null);
    Goods.unscoped.mockReturnValue(Goods);

    await expect(movementService.createMovement(operatorId, data)).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
