// routes/closingRouter.js
const express = require('express');
const { closePeriod } = require('../../controllers/Finance/closingController');

const closingRouter = express.Router();

closingRouter.post('/', closePeriod);

module.exports = closingRouter;