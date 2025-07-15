const ChartAccount = require("../models/chartAccountsModel.js");
const Tax = require("../models/taxModel.js");

exports.save = async (req, res) => {
    try {
        const { name, rate } = req.body;

        if (!name || rate === undefined) {
            throw new Error("Tax name and rate are required");
        }

        // Standardize COA name
        const coaName = `${name} - Tax`;
        // Step 1: Ensure parent 'Tax Payable' account exists
        let parentTaxAccount = await ChartAccount.findOne({ name: "Tax Payable", group: "Liabilities", isTaxAccount: true });
        if (!parentTaxAccount) {
            parentTaxAccount = await ChartAccount.create({
                name: "Tax Payable",
                group: "Liabilities",
                category: "Current Liability",
                nature: "Credit",
                isTaxAccount: true,
                createdBy: "system"
            });
        }

        // Try to find existing COA with this name
        let taxAccount = await ChartAccount.findOne({
            name: coaName,
            isTaxAccount: true,
        });

        // If not found, create a new COA
        taxAccount = await ChartAccount.create({
            name: coaName,
            group: "Liabilities",
            category: "Current Liability", // because it's child
            nature: "Credit",
            parentAccount: parentTaxAccount._id,
            isTaxAccount: true,
            createdBy: "system"
        });

        // Create Tax Record
        const tax = new Tax({
            name,
            rate,
            coa: taxAccount._id,
        });

        await tax.save();

        res.status(201).json({
            success: true,
            message: "Tax created successfully",
            data: tax,
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: `Error creating tax: ${error.message}`,
        });
    }
};


exports.view = async (req, res) => {
    try {

        const taxes = await Tax.find().populate("coa");

        return res.status(200).json({
            success: true,
            data: taxes,
        });
    } catch (error) {
        res.status(500).json({ success: false, message: `Error fetching taxes: ${error.message}` });
    }
};

