const mongoose = require("mongoose");
const JournalVoucher = require("../../models/Finance/journalVoucherModel.js");
const ChartAccount = require("../../models/Finance/chartAccountsModel.js");
const AuditLog = require("../../models/Finance/auditLogModel.js");
const Period = require("../../models/Finance/periodModel.js");
const { updateRetainedEarnings } = require("../../utils/accounting.js");
const errorMessages = require("../../utils/errorMessages.js");
const Joi = require('joi');
const sanitize = require('mongo-sanitize');

const journalSchema = Joi.object({
  date: Joi.date().required().error(new Error(errorMessages.invalidDate)),
  reference: Joi.string().max(50).optional(),
  description: Joi.string().max(200).optional(),
  accounts: Joi.array().min(2).items(
    Joi.object({
      account: Joi.string().required().error(new Error(errorMessages.invalidAccount)),
      debitAmount: Joi.number().min(0).optional(),
      creditAmount: Joi.number().min(0).optional(),
      narration: Joi.string().max(200).optional()
    })
  ).required().error(new Error(errorMessages.missingFields)),
  status: Joi.string().valid('Draft', 'Posted').default('Draft')
});

const add = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { error } = journalSchema.validate(req.body);
    if (error) throw new Error(error.message);

    const { date, reference, description, accounts, status } = req.body;
    console.log("Received data:", req.body);
    const parsedDate = new Date(date);

    // Check for closed period
    const closedPeriod = await Period.findOne({ endDate: { $gte: parsedDate }, status: 'closed' }).session(session);
    if (closedPeriod) throw new Error(errorMessages.closedPeriod);

    const accountIds = accounts.map((acc) => acc.account);
    if (new Set(accountIds).size !== accountIds.length) {
      throw new Error(errorMessages.duplicateAccounts);
    }

    for (const acc of accounts) {
      if (!acc.account || (!acc.debitAmount && !acc.creditAmount) || (acc.debitAmount && acc.creditAmount)) {
        throw new Error(errorMessages.invalidAccount);
      }
    }

    const totalDebit = accounts.reduce((sum, acc) => sum + (acc.debitAmount || 0), 0);
    const totalCredit = accounts.reduce((sum, acc) => sum + (acc.creditAmount || 0), 0);
    if (Math.abs(totalDebit - totalCredit) > 0.01) {
      throw new Error(errorMessages.unbalancedEntry);
    }

    const chartAccounts = await ChartAccount.find({ _id: { $in: accountIds } }).session(session);
    if (chartAccounts.length !== accountIds.length) {
      throw new Error(errorMessages.accountNotFound);
    }

    if (status === "Posted") {
      for (const acc of accounts) {
        const chartAccount = chartAccounts.find(ca => ca._id.toString() === acc.account.toString());
        const isDebitNature = ['Assets', 'Expense'].includes(chartAccount.group);
        const balanceChange = isDebitNature
          ? (acc.debitAmount || 0) - (acc.creditAmount || 0)
          : (acc.creditAmount || 0) - (acc.debitAmount || 0);

        chartAccount.currentBalance += balanceChange;
        await chartAccount.save({ session });
        await chartAccount.calculateAndUpdateParentBalance(session);

        if (['Income', 'Expense'].includes(chartAccount.group)) {
          await updateRetainedEarnings(acc.account, balanceChange, chartAccount.group, session);
        }
      }
    }

    const journalEntry = new JournalVoucher({
      date: parsedDate,
      reference,
      description: description ? sanitize(description.trim()) : undefined,
      accounts: accounts.map(acc => ({
        account: acc.account,
        debitAmount: acc.debitAmount || 0,
        creditAmount: acc.creditAmount || 0,
        narration: acc.narration ? sanitize(acc.narration.trim()) : undefined
      })),
      status: status || 'Draft',
    });
    await journalEntry.save({ session });

    // Log audit trail
    await AuditLog.create(
      [{
        action: 'create',
        entity: 'JournalVoucher',
        entityId: journalEntry._id,
        changes: req.body,
        timestamp: new Date()
      }],
      { session }
    );

    await session.commitTransaction();
    res.status(201).json({ success: true, message: 'Journal entry created', data: journalEntry });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

const get = async (req, res) => {
  const { page = 1, limit = 10, search, startDate, endDate } = req.query;
  const sanitizedSearch = sanitize(search);
  try {
    const query = {};
    if (sanitizedSearch) {
      query.$or = [
        { reference: { $regex: sanitizedSearch, $options: "i" } },
        { description: { $regex: sanitizedSearch, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const total = await JournalVoucher.countDocuments(query);
    const entries = await JournalVoucher.find(query)
      .populate("accounts.account", "name group")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    return res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: entries,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: errorMessages.accountNotFound,
    });
  }
};

const update = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { voucherId, status } = req.body;

    const voucher = await JournalVoucher.findById(voucherId).session(session);
    if (!voucher) {
      throw new Error('Voucher not found');
    }

    if (voucher.status === 'Posted' && status === 'Draft') {
      throw new Error('Cannot change Posted voucher to Draft');
    }



    // Update voucher 
    voucher.status = status || voucher.status;

    // If changing to Posted, post the journal entries
    if (status === 'Posted' && voucher.status !== 'Posted') {
      // Add your posting logic here (similar to purchase invoice)
      // This should create journal entries, update balances, etc.
    }

    // Log audit trail
    await AuditLog.create({
      action: 'update',
      entity: 'JournalVoucher',
      entityId: voucher._id,
      changes: req.body,
      timestamp: new Date()
    }, { session });

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Voucher updated successfully',
      data: voucher,
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

const remove = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { voucherId } = req.params;
    const voucher = await JournalVoucher.findById(voucherId).session(session);
    if (!voucher) {
      throw new Error('Voucher not found');
    }

    const chartAccounts = await ChartAccount.find({ _id: { $in: voucher.accounts.map((a) => a.account) } }).session(session);
    for (const acc of voucher.accounts) {
      const chartAccount = chartAccounts.find((ca) => ca._id.toString() === acc.account.toString());
      const amount = acc.debitAmount || acc.creditAmount;
      const isDebit = !!acc.debitAmount;
      if (chartAccount.nature === "Debit") {
        chartAccount.currentBalance -= isDebit ? amount : -amount;
      } else if (chartAccount.nature === "Credit") {
        chartAccount.currentBalance -= isDebit ? -amount : amount;
      }
      await chartAccount.save({ session });
      if (['Income', 'Expense'].includes(chartAccount.group)) {
        await updateRetainedEarnings(acc.account, -amount, chartAccount.group, session);
      }
    }

    // Log audit trail
    await AuditLog.create({
      action: 'delete',
      entity: 'JournalVoucher',
      entityId: voucher._id,
      changes: { voucherId },
      timestamp: new Date()
    }, { session });

    await JournalVoucher.findByIdAndDelete(voucherId).session(session);

    await session.commitTransaction();
    res.status(200).json({
      success: true,
      message: 'Voucher deleted successfully',
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message,
    });
  } finally {
    session.endSession();
  }
};

module.exports = { add, get, update, remove };