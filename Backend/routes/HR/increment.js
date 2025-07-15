const express = require('express');
const { addIncrement, getAllIncrements, getIncrementsByEntity, updateIncrement, deleteIncrement } = require('../../controllers/HR/increment');
const { protect } = require('../../middlewares/authMiddleware');

const incrementRouter = express.Router();
incrementRouter.use(protect);

incrementRouter.post('/', addIncrement);
incrementRouter.get('/', getAllIncrements);
incrementRouter.get('/:type/:id', getIncrementsByEntity);
incrementRouter.put('/:id', updateIncrement);
incrementRouter.delete('/:id', deleteIncrement);

module.exports = incrementRouter;