const mongoose = require("mongoose");
const COALedger = require("../models/coaLedger");
const ChartAccount = require("../models/chartAccountsModel");

const createCOALedgerEntry = async ({
    coaId,
    date,
    debit = 0,
    credit = 0,
    reference,
    sourceType,
    sourceId,
    description,
    session,
    createdBy = "system",
}) => {
    try {
        // Fetch the current balance of the Chart of Account
        const chartAccount = await ChartAccount.findById(coaId).session(session);
        if (!chartAccount) {
            throw new Error("Chart of Account not found");
        }

        // Calculate balanceAfter based on debit and credit
        const balanceAfter = chartAccount.currentBalance + debit - credit;

        // Create ledger entry
        const ledgerEntry = new COALedger({
            coaId,
            date: date || new Date(),
            debit,
            credit,
            balanceAfter,
            reference,
            sourceType,
            sourceId,
            description: description || `${sourceType} transaction`,
            createdBy,
        });

        await ledgerEntry.save({ session });
        console.log(`[${new Date().toISOString()}] createCOALedgerEntry: Ledger entry created`, {
            coaId,
            reference,
            sourceType,
            balanceAfter,
        });

        return ledgerEntry;
    } catch (error) {
        console.error(`[${new Date().toISOString()}] createCOALedgerEntry: Error`, { error: error.message });
        throw error;
    }
};

module.exports = { createCOALedgerEntry };