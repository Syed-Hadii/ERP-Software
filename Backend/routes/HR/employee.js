const express = require('express');

const employeeRouter = express.Router();

// Import controllers
const { 
    createEmployee,
    getAllEmployees,
    getEmployeeById,
    updateEmployee,
    deleteEmployee
} = require('../../controllers/HR/employees');

// Employee routes
employeeRouter.post('/', createEmployee);
employeeRouter.get('/', getAllEmployees);
employeeRouter.get('/:id', getEmployeeById);
employeeRouter.put('/:id', updateEmployee);
employeeRouter.delete('/:id', deleteEmployee);

module.exports = employeeRouter;