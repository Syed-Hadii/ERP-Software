const express = require('express');
const batchEntryRouter = express.Router();
const { add, view, update, remove } = require('../../controllers/Finance/batchEntry');
// const authMiddleware = require('../middleware/authMiddleware');

// Create a new batch transaction
batchEntryRouter.post('/', add);

// Get all batch transactions
batchEntryRouter.get('/', view);

// Update batch transaction
batchEntryRouter.put('/:id', update);

// Delete batch transaction
batchEntryRouter.delete('/:id', remove);


module.exports = batchEntryRouter;