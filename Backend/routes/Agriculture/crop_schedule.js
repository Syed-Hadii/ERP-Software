// This file should be added to your project to define the schedule API routes

const express = require("express")
const scheduleRouter = express.Router()
const scheduleController = require("../../controllers/Agriculture/crop_schedule")
// const { protect, admin } = require("../../middlewares/authMiddleware");

// scheduleRouter.use(protect, admin);
// Irrigation routes
scheduleRouter.post("/irrigation", scheduleController.createIrrigation)
scheduleRouter.get("/irrigation", scheduleController.getIrrigations)
scheduleRouter.put("/irrigation/:id", scheduleController.updateIrrigation)
scheduleRouter.delete("/irrigation/:id", scheduleController.deleteIrrigation)

// Fertilization routes
scheduleRouter.post("/fertilization", scheduleController.createFertilization)
scheduleRouter.get("/fertilization", scheduleController.getFertilizations)
scheduleRouter.put("/fertilization/:id", scheduleController.updateFertilization)
scheduleRouter.delete("/fertilization/:id", scheduleController.deleteFertilization)

// Pesticide routes
scheduleRouter.post("/pesticide", scheduleController.createPesticide)
scheduleRouter.get("/pesticide", scheduleController.getPesticides)
scheduleRouter.put("/pesticide/:id", scheduleController.updatePesticide)
scheduleRouter.delete("/pesticide/:id", scheduleController.deletePesticide)

module.exports = scheduleRouter
