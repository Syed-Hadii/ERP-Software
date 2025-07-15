const Notification = require('../../models/notificationModel');
const Crop_Sow = require('../../models/Agriculture/crop-sow');
const { IrrigationSchedule, FertilizationSchedule, PesticideSchedule } = require('../../models/Agriculture/crop_schedules');
const { generateInventoryRequestResponseNotifications } = require('../Inventory/inventoryNotificationController');

const generateHarvestNotifications = async (req, res) => {
    try {
        const harvestDays = parseInt(process.env.HARVEST_NOTIFICATION_DAYS) || 7;
        const harvestDate = new Date();
        harvestDate.setDate(harvestDate.getDate() + harvestDays);

        const cropsToHarvest = await Crop_Sow.find({
            expectedHarvestDate: { $lte: harvestDate }
        }).populate('crop variety farmer');

        let count = 0;
        for (const crop of cropsToHarvest) {
            if (!crop.crop || !crop.variety || !crop.farmer) {
                console.warn(`Skipping crop ${crop._id}: Missing crop, variety, or farmer`);
                continue;
            }

            const daysUntilHarvest = Math.ceil((crop.expectedHarvestDate - new Date()) / (1000 * 60 * 60 * 24));
            const existingNotification = await Notification.findOne({
                type: 'harvest',
                entityId: crop._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'harvest',
                    title: `Harvest Alert: ${crop.crop.name || 'Crop'} ${crop.variety.name || ''}`,
                    message: `Harvest in ${daysUntilHarvest} day${daysUntilHarvest !== 1 ? 's' : ''}`,
                    domain: 'agriculture',
                    entityId: crop._id,
                    entityModel: 'Crop_Sow',
                    dueDate: crop.expectedHarvestDate,
                    priority: daysUntilHarvest <= 2 ? 'high' : 'medium',
                    recipients: [crop.farmer._id],
                    roles: ['Crop Manager', 'Admin'],
                    harvestDetails: { expectedYield: crop.yieldEstimate, daysUntilHarvest }
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Harvest notifications generated', count });
    } catch (error) {
        console.error('Error generating harvest notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate harvest notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateScheduleNotifications = async (req, res) => {
    try {
        const scheduleDays = parseInt(process.env.SCHEDULE_NOTIFICATION_DAYS) || 3;
        const scheduleDate = new Date();
        scheduleDate.setDate(scheduleDate.getDate() + scheduleDays);

        const irrigationSchedules = await IrrigationSchedule.find({
            date: { $lte: scheduleDate },
            status: 'pending'
        }).populate('crop employee');
        const fertilizationSchedules = await FertilizationSchedule.find({
            date: { $lte: scheduleDate },
            status: 'pending'
        }).populate('crop employee');
        const pesticideSchedules = await PesticideSchedule.find({
            date: { $lte: scheduleDate },
            status: 'pending'
        }).populate('crop employee');

        const allSchedules = [...irrigationSchedules, ...fertilizationSchedules, ...pesticideSchedules];
        let count = 0;

        for (const schedule of allSchedules) {
            if (!schedule.crop || !schedule.employee) {
                console.warn(`Skipping schedule ${schedule._id}: Missing crop or employee`);
                continue;
            }

            const daysUntilSchedule = Math.ceil((schedule.date - new Date()) / (1000 * 60 * 60 * 24));
            const scheduleType = schedule.quantity && schedule.method ? 'irrigation' : schedule.fertilizer ? 'fertilization' : 'pesticide';
            const existingNotification = await Notification.findOne({
                type: 'schedule',
                entityId: schedule._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'schedule',
                    title: `${scheduleType.charAt(0).toUpperCase() + scheduleType.slice(1)} Schedule: ${schedule.crop.crop?.name || 'Crop'}`,
                    message: `${scheduleType} scheduled in ${daysUntilSchedule} day${daysUntilSchedule !== 1 ? 's' : ''}`,
                    domain: 'agriculture',
                    entityId: schedule._id,
                    entityModel: schedule.quantity && schedule.method ? 'Irrigation_Schedule' : schedule.fertilizer ? 'Fertilization_Schedule' : 'Pesticide_Schedule',
                    dueDate: schedule.date,
                    priority: daysUntilSchedule <= 1 ? 'high' : 'medium',
                    recipients: [schedule.employee._id],
                    roles: ['Crop Manager'],
                    scheduleDetails: {
                        scheduleType,
                        quantity: schedule.quantity ? `${schedule.quantity} ${schedule.unit || 'units'}` : `${schedule.amount || 'N/A'} ${schedule.unit || 'units'}`
                    }
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Schedule notifications generated', count });
    } catch (error) {
        console.error('Error generating schedule notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed generate schedule notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateAllAgricultureNotifications = async (req, res) => {
    try {
        let totalCount = 0;
        const fakeRes = {
            json: (data) => { totalCount += data.count || 0 },
            status: () => ({ json: () => { } })
        };

        await generateHarvestNotifications(req, fakeRes);
        await generateScheduleNotifications(req, fakeRes);
        await generateInventoryRequestResponseNotifications(req, fakeRes);

        res.json({
            success: true,
            message: 'All agriculture notifications generated',
            count: totalCount
        });
    } catch (error) {
        console.error('Error generating all agriculture notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate all agriculture notifications',
            count: 0,
            fallback: true
        });
    }
};

module.exports = {
    generateHarvestNotifications,
    generateScheduleNotifications,
    generateAllAgricultureNotifications
};