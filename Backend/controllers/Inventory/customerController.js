const mongoose = require("mongoose");
const Customer = require("../../models/Inventory/customerModel");
const ChartAccount = require("../../models/Finance/chartAccountsModel"); 

const save = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { name, contact, email, address, openingBalance } = req.body;

        if (!name || openingBalance === undefined) {
            throw new Error("Name and opening balance are required");
        }

        // Find or create Accounts Receivable parent
        let arParent = await ChartAccount.findOne({
            name: "Accounts Receivable",
            parentAccount: null,
        }).session(session);

        if (!arParent) {
            arParent = new ChartAccount({
                name: "Accounts Receivable",
                code: "AR",
                group: "Assets",
                category: "Current Asset",
                openingBalance: 0,
                currentBalance: 0,
            });
            await arParent.save({ session });
        }

        // Generate customer code
        const latestCustomer = await ChartAccount.findOne({
            code: /^CUS\d+$/,
        }).sort({ code: -1 }).session(session);

        let newCode = "CUS001";
        if (latestCustomer) {
            const lastNumber = parseInt(latestCustomer.code.slice(3));
            newCode = `CUS${String(lastNumber + 1).padStart(3, "0")}`;
        }

        // Create customer child account
        const childAccount = new ChartAccount({
            name,
            code: newCode,
            group: "Assets",
            category: "Current Asset",
            parentAccount: arParent._id,
            openingBalance,
            currentBalance: openingBalance,
        });
        await childAccount.save({ session });

        // Create customer
        const customer = new Customer({
            name,
            contact,
            email,
            address,
            openingBalance,
            currentBalance: openingBalance,
            coaId: childAccount._id,
        });
        await customer.save({ session });

        // Opening balance journal entry
        if (openingBalance > 0) {
            const openingEquity = await ChartAccount.findOne({
                name: "Opening Balance Equity",
            }).session(session);
            if (!openingEquity) throw new Error("Opening Balance Equity account not found");

           

            // Update parent account balance
            arParent.currentBalance += openingBalance;
            await arParent.save({ session });
        }

        await session.commitTransaction();
        res.status(201).json({ success: true, message: "Customer created", data: customer });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: `Error creating customer: ${error.message}` });
    } finally {
        session.endSession();
    }
};

const view = async (req, res) => {
    try {
        const fetchAll = req.query.all === "true";
        if (fetchAll) {
            const customers = await Customer.find({}).populate("coaId", "name code openingBalance currentBalance");
            return res.status(200).json({
                success: true,
                totalCustomers: customers.length,
                data: customers,
            });
        }

        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 7;
        const skip = (page - 1) * limit;

        const totalCustomers = await Customer.countDocuments();
        const customers = await Customer.find({})
            .populate("coaId", "name code openingBalance currentBalance")
            .skip(skip)
            .limit(limit);

        return res.status(200).json({
            success: true,
            totalCustomers,
            totalPages: Math.ceil(totalCustomers / limit),
            currentPage: page,
            data: customers,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching customers: ${error.message}` });
    }
};

const update = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const { name, contact, email, address, openingBalance } = req.body;

        if (!id || !name || openingBalance === undefined) {
            throw new Error("ID, name, and opening balance are required");
        }

        const customer = await Customer.findById(id).session(session);
        if (!customer) throw new Error("Customer not found");

        const childAccount = await ChartAccount.findById(customer.coaId).session(session);
        if (!childAccount) throw new Error("Associated chart account not found");

        const arParent = await ChartAccount.findById(childAccount.parentAccount).session(session);
        if (!arParent) throw new Error("Parent account not found");

        // Adjust parent balance for old opening balance
        arParent.currentBalance -= customer.openingBalance;
        await arParent.save({ session });

        // Update customer
        customer.name = name;
        customer.contact = contact || "";
        customer.email = email || "";
        customer.address = address || "";
        customer.openingBalance = openingBalance;
        await customer.save({ session });

        // Update chart account
        childAccount.name = name;
        childAccount.openingBalance = openingBalance;
        childAccount.currentBalance = childAccount.currentBalance - customer.openingBalance + openingBalance;
        await childAccount.save({ session });

        // Update parent balance for new opening balance
        arParent.currentBalance += openingBalance;
        await arParent.save({ session });

       

        if (openingBalance > 0) {
            const openingEquity = await ChartAccount.findOne({ name: "Opening Balance Equity" }).session(session);
            if (!openingEquity) throw new Error("Opening Balance Equity account not found");

             
        }

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Customer updated", data: customer });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: `Error updating customer: ${error.message}` });
    } finally {
        session.endSession();
    }
};

const remove = async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const { id } = req.params;
        const customer = await Customer.findById(id).session(session);
        if (!customer) throw new Error("Customer not found");

         
        const childAccount = await ChartAccount.findById(customer.coaId).session(session);
        if (!childAccount) throw new Error("Associated chart account not found");

        const arParent = await ChartAccount.findById(childAccount.parentAccount).session(session);
        if (!arParent) throw new Error("Parent account not found");

        // Adjust parent balance
        arParent.currentBalance -= customer.openingBalance;
        await arParent.save({ session });

        
        await ChartAccount.findByIdAndDelete(customer.coaId).session(session);
        await Customer.findByIdAndDelete(id).session(session);

        await session.commitTransaction();
        res.status(200).json({ success: true, message: "Customer deleted" });
    } catch (error) {
        await session.abortTransaction();
        res.status(500).json({ success: false, message: `Error deleting customer: ${error.message}` });
    } finally {
        session.endSession();
    }
};

module.exports = { save, view, update, remove };