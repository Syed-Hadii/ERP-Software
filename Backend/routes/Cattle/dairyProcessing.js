const express = require('express');
const dairyProcessRouter = express.Router();
const {
    createDairyProcessing,
    getAllDairyProcessing,
    getDairyProcessingById,
    updateDairyProcessing, 
    updateStatus,
    getRawMilkOptions,
    getDairyProducts
} = require('../../controllers/Cattle/dairyProcessing');
// const { protect, admin } = require('../../middlewares/authMiddleware');
// Apply auth middleware to all dairy processing routes
// dairyProcessRouter.use(protect);

dairyProcessRouter.get('/raw-milk', getRawMilkOptions);
dairyProcessRouter.get('/products', getDairyProducts);
dairyProcessRouter.post('/', createDairyProcessing);
dairyProcessRouter.get('/', getAllDairyProcessing);
dairyProcessRouter.get('/:id', getDairyProcessingById);
dairyProcessRouter.put('/:id', updateDairyProcessing); 
dairyProcessRouter.patch('/:id/status', updateStatus);

module.exports = dairyProcessRouter;