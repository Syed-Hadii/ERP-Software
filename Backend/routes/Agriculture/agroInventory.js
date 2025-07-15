const express = require('express');
const agroInventoryRouter = express.Router();
const {
    addStock,
    removeStock,
    getAgroInventory,
    getAgroInventoryById,
    updateAgroInventory
} = require('../../controllers/Agriculture/agroInventory');

// Routes for agro inventory management
agroInventoryRouter.post('/add', addStock);
agroInventoryRouter.post('/remove', removeStock);
agroInventoryRouter.get('/', getAgroInventory);
agroInventoryRouter.get('/:id', getAgroInventoryById);
agroInventoryRouter.put('/:id', updateAgroInventory);

module.exports = agroInventoryRouter;
