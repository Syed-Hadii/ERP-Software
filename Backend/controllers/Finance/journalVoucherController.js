const mongoose = require("mongoose");
const JournalVoucher = require("../../models/Finance/journalVoucherModel.js");
const ChartAccount = require("../../models/Finance/chartAccountsModel.js");

const add = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { date, reference, description, accounts } = req.body;
    console.log(req.body)
    if (!date || !accounts || !Array.isArray(accounts) || accounts.length < 2) {
      throw new Error('Date and at least two accounts are required');
    }

    const accountIds = accounts.map((acc) => acc.account); // Changed to acc.account
    if (new Set(accountIds).size !== accountIds.length) {
      throw new Error("Duplicate accounts not allowed");
    }

    for (const acc of accounts) {
      if (!acc.account || (!acc.debitAmount && !acc.creditAmount) || (acc.debitAmount && acc.creditAmount)) {
        throw new Error('Each account must have either debit or credit, not both or neither');
      }
    }

    const totalDebit = accounts.reduce((sum, acc) => sum + (acc.debitAmount || 0), 0);
    const totalCredit = accounts.reduce((sum, acc) => sum + (acc.creditAmount || 0), 0);
    if (totalDebit !== totalCredit) {
      throw new Error('Total debit must equal total credit');
    } const chartAccounts = await ChartAccount.find({ _id: { $in: accountIds } }).session(session);
    if (chartAccounts.length !== accountIds.length) {
      throw new Error('One or more chart accounts not found');
    }    // Update account balances and handle retained earnings
    for (const acc of accounts) {
      const chartAccount = chartAccounts.find(ca => ca._id.toString() === acc.account.toString());
      const isDebitNature = ['Assets', 'Expense'].includes(chartAccount.group);
      const balanceChange = isDebitNature ?
        (acc.debitAmount || 0) - (acc.creditAmount || 0) :
        (acc.creditAmount || 0) - (acc.debitAmount || 0);

      chartAccount.currentBalance += balanceChange;
      await chartAccount.save({ session });

      // Handle Income/Expense effect on Retained Earnings
      if (['Income', 'Expense'].includes(chartAccount.group)) {
        const retainedEarnings = await ChartAccount.findOne({
          category: 'Retained Earnings'
        }).session(session);

        if (retainedEarnings) {
          let retainedEarningsChange = 0;

          if (chartAccount.group === 'Income') {
            // Income credited (increased) = Credit Retained Earnings
            // Income debited (decreased) = Debit Retained Earnings
            retainedEarningsChange = (acc.creditAmount || 0) - (acc.debitAmount || 0);
          } else { // Expense
            // Expense debited (increased) = Debit Retained Earnings
            // Expense credited (decreased) = Credit Retained Earnings
            retainedEarningsChange = (acc.creditAmount || 0) - (acc.debitAmount || 0);
          }

          retainedEarnings.currentBalance += retainedEarningsChange;
          await retainedEarnings.save({ session });
        }
      }
    }

    const journalEntry = new JournalVoucher({
      date,
      reference,
      description,
      accounts,
      status: 'Posted'
    });
    await journalEntry.save({ session });

    await session.commitTransaction();
    res.status(201).json({ success: true, message: 'Journal entry created', data: journalEntry });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

const get = async (req, res) => {
  const { page = 1, limit = 10, search, startDate, endDate } = req.query;

  try {
    const query = {};
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
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
    console.error("Error fetching journal entries:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching journal entries.",
    });
  }
};

const update = async (req, res) => {
  const { voucherId, date, reference, description, accounts } = req.body;

  try {
    const voucher = await JournalVoucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    // Validate accounts and amounts
    if (accounts) {
      for (const acc of accounts) {
        if (!acc.account || (!acc.debitAmount && !acc.creditAmount) || (acc.debitAmount && acc.creditAmount)) {
          return res.status(400).json({
            success: false,
            message: "Each account must have either debitAmount or creditAmount, not both or neither.",
          });
        }
      }

      // Check debit and credit balance
      const totalDebit = accounts.reduce((sum, acc) => sum + (acc.debitAmount || 0), 0);
      const totalCredit = accounts.reduce((sum, acc) => sum + (acc.creditAmount || 0), 0);
      if (totalDebit !== totalCredit) {
        return res.status(400).json({
          success: false,
          message: "Total debit amount must equal total credit amount.",
        });
      }      // Revert old balances
      const oldAccounts = await ChartAccount.find({ _id: { $in: voucher.accounts.map((a) => a.account) } });
      for (const acc of voucher.accounts) {
        const chartAccount = oldAccounts.find((ca) => ca._id.toString() === acc.account.toString());
        const isDebitNature = ['Assets', 'Expense'].includes(chartAccount.group);
        const balanceChange = isDebitNature ?
          (acc.debitAmount || 0) - (acc.creditAmount || 0) :
          (acc.creditAmount || 0) - (acc.debitAmount || 0);

        chartAccount.currentBalance -= balanceChange; // Revert the old balance change
        await chartAccount.save({ session });
      }

      // Update new balances
      const accountIds = accounts.map((acc) => acc.account);
      const chartAccounts = await ChartAccount.find({ _id: { $in: accountIds } });
      if (chartAccounts.length !== accountIds.length) {
        return res.status(400).json({
          success: false,
          message: "One or more chart accounts not found.",
        });
      } for (const acc of accounts) {
        const chartAccount = chartAccounts.find((ca) => ca._id.toString() === acc.account.toString());
        const isDebitNature = ['Assets', 'Expense'].includes(chartAccount.group);
        const balanceChange = isDebitNature ?
          (acc.debitAmount || 0) - (acc.creditAmount || 0) :
          (acc.creditAmount || 0) - (acc.debitAmount || 0);

        chartAccount.currentBalance += balanceChange;
        await chartAccount.save({ session });
      }
    }

    // Update voucher
    voucher.date = date || voucher.date;
    voucher.reference = reference || voucher.reference;
    voucher.description = description || voucher.description;
    if (accounts) voucher.accounts = accounts;

    await voucher.save();

    res.status(200).json({
      success: true,
      message: "Voucher updated successfully",
      data: voucher,
    });
  } catch (error) {
    console.error("Error updating voucher:", error);
    res.status(500).json({
      success: false,
      message: "Error updating voucher",
      error: error.message,
    });
  }
};

const remove = async (req, res) => {
  try {
    const { voucherId } = req.body;
    const voucher = await JournalVoucher.findById(voucherId);
    if (!voucher) {
      return res.status(404).json({ success: false, message: "Voucher not found" });
    }

    // Revert account balances
    const chartAccounts = await ChartAccount.find({ _id: { $in: voucher.accounts.map((a) => a.account) } });
    for (const acc of voucher.accounts) {
      const chartAccount = chartAccounts.find((ca) => ca._id.toString() === acc.account.toString());
      const amount = acc.debitAmount || acc.creditAmount;
      const isDebit = !!acc.debitAmount;
      if (chartAccount.nature === "Debit") {
        chartAccount.currentBalance -= isDebit ? amount : -amount;
      } else if (chartAccount.nature === "Credit") {
        chartAccount.currentBalance -= isDebit ? -amount : amount;
      }
      await chartAccount.save();
    }

    await JournalVoucher.findByIdAndDelete(voucherId);

    res.status(200).json({
      success: true,
      message: "Voucher deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting voucher:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting voucher",
      error: error.message,
    });
  }
};

module.exports = { add, get, update, remove };