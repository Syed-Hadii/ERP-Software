const express = require('express');
const milkRouter = express.Router();
const {
    listMilkProduction,
    createMilkProduction,
    getMilkProduction,
    updateMilkProduction,
    deleteMilkProduction
} = require('../../controllers/Cattle/milkProductionController');
// const { protect, admin } = require('../../middlewares/authMiddleware');
// Apply auth middleware to all milk production routes
// milkRouter.use(protect);

// Get all milk production records with filtering and pagination
milkRouter.get('/', listMilkProduction);

// Create new milk production record
milkRouter.post('/', createMilkProduction);

// Get single milk production record
milkRouter.get('/:id', getMilkProduction);

// Update milk production record
milkRouter.put('/:id', updateMilkProduction);

// Delete milk production record
milkRouter.delete('/:id', deleteMilkProduction);

module.exports = milkRouter;
