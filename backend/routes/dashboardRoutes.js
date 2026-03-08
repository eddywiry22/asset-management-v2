const { Router } = require('express');
const { authenticate } = require('../middlewares/authMiddleware');
const {
  getStockOverview,
  getMovementReport,
  getMovementRequestSummary,
  getStockChartData,
  getMovementTrends,
  exportStock,
  exportMovements,
  getLocations,
  getGoods,
  getStockPeriodSummary,
} = require('../controllers/dashboardController');

const router = Router();

// All dashboard routes require authentication
router.use(authenticate);

router.get('/stock-overview', getStockOverview);
router.get('/movement-report', getMovementReport);
router.get('/movement-request-summary', getMovementRequestSummary);
router.get('/stock-chart', getStockChartData);
router.get('/movement-trends', getMovementTrends);
router.get('/export/stock', exportStock);
router.get('/export/movements', exportMovements);

// BUG-R8-07: period-based stock summary (qty_before, inbound, outbound, qty_after, total_requests)
router.get('/stock-period-summary', getStockPeriodSummary);

// Filter dropdown data
router.get('/locations', getLocations);
router.get('/goods', getGoods);

module.exports = router;
