const Notification = require('../../models/notificationModel');
const Cattle_Event = require('../../models/Cattle/healthEvent');
const Cattle_Milk = require('../../models/Cattle/milkProduction');

const generateHealthNotifications = async (req, res) => {
    try {
        const healthDays = parseInt(process.env.HEALTH_NOTIFICATION_DAYS) || 7;
        const healthDate = new Date();
        healthDate.setDate(healthDate.getDate() + healthDays);

        const healthEvents = await Cattle_Event.find({
            date: { $lte: healthDate },
            type: { $in: ['vaccination', 'checkup'] }
        }).populate('cattle vetTechnician');

        let count = 0;
        for (const event of healthEvents) {
            if (!event.cattle || !event.vetTechnician) {
                console.warn(`Skipping health event ${event._id}: Missing cattle or vetTechnician`);
                continue;
            }

            const daysUntilEvent = Math.ceil((event.date - new Date()) / (1000 * 60 * 60 * 24));
            const existingNotification = await Notification.findOne({
                type: 'cattle-health',
                entityId: event._id,
                isRead: false
            });

            if (!existingNotification) {
                const newNotification = new Notification({
                    type: 'cattle-health',
                    title: `${event.type} for Cattle: ${event.cattle.tagNo || 'Unknown'}`,
                    message: `${event.type} scheduled in ${daysUntilEvent} day${daysUntilEvent !== 1 ? 's' : ''}`,
                    domain: 'cattle',
                    entityId: event._id,
                    entityModel: 'Cattle_Event',
                    dueDate: event.date,
                    priority: daysUntilEvent <= 1 ? 'high' : 'medium',
                    recipients: [event.vetTechnician._id],
                    roles: ['Dairy Manager', 'Admin']
                });
                await newNotification.save();
                count++;
            }
        }
        res.json({ success: true, message: 'Health notifications generated', count });
    } catch (error) {
        console.error('Error generating health notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate health notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateMilkProductionNotifications = async (req, res) => {
    try {
        const milkDays = parseInt(process.env.MILK_PRODUCTION_CHECK_DAYS) || 1;
        const milkRecords = await Cattle_Milk.find({
            date: { $gte: new Date(new Date() - milkDays * 24 * 60 * 60 * 1000) }
        }).populate('cattle');

        let count = 0;
        for (const record of milkRecords) {
            if (!record.cattle) {
                console.warn(`Skipping milk record ${record._id}: Missing cattle`);
                continue;
            }

            if (record.quantity < 5) {
                const existingNotification = await Notification.findOne({
                    type: 'cattle-milking',
                    entityId: record._id,
                    isRead: false
                });

                if (!existingNotification) {
                    const newNotification = new Notification({
                        type: 'cattle-milking',
                        title: `Low Milk Yield: ${record.cattle.tagNo || 'Unknown'}`,
                        message: `Milk yield is ${record.quantity} liters, below threshold`,
                        domain: 'cattle',
                        entityId: record._id,
                        entityModel: 'Cattle_Milk',
                        dueDate: new Date(),
                        priority: 'high',
                        recipients: [],
                        roles: ['Dairy Manager', 'Admin']
                    });
                    await newNotification.save();
                    count++;
                }
            }
        }
        res.json({ success: true, message: 'Milk production notifications generated', count });
    } catch (error) {
        console.error('Error generating milk production notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate milk production notifications',
            count: 0,
            fallback: true
        });
    }
};

const generateAllCattleNotifications = async (req, res) => {
    try {
        let totalCount = 0;
        const fakeRes = {
            json: (data) => { totalCount += data.count || 0 },
            status: () => ({ json: () => { } })
        };

        await generateHealthNotifications(req, fakeRes);
        await generateMilkProductionNotifications(req, fakeRes);

        res.json({
            success: true,
            message: 'All cattle notifications generated',
            count: totalCount
        });
    } catch (error) {
        console.error('Error generating all cattle notifications:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate all cattle notifications',
            count: 0,
            fallback: true
        });
    }
};

module.exports = {
    generateHealthNotifications,
    generateMilkProductionNotifications,
    generateAllCattleNotifications
};