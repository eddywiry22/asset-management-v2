const referenceDataService = require('../services/referenceDataService');
const { success } = require('../utils/response');

const getLocations = async (req, res, next) => {
  try {
    const locations = await referenceDataService.listLocations();
    return success(res, locations, 'Locations retrieved');
  } catch (err) {
    return next(err);
  }
};

const getItems = async (req, res, next) => {
  try {
    const items = await referenceDataService.listItems();
    return success(res, items, 'Items retrieved');
  } catch (err) {
    return next(err);
  }
};

const getStocks = async (req, res, next) => {
  try {
    const { locationId } = req.query;
    const stocks = await referenceDataService.listStocksByLocation(locationId);
    return success(res, stocks, 'Stocks retrieved');
  } catch (err) {
    return next(err);
  }
};

module.exports = { getLocations, getItems, getStocks };
