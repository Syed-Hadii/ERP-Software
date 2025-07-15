const mongoose = require('mongoose');
const BankAccount = require("../../models/Finance/bankAccountModel.js");
const ChartAccount = require("../../models/Finance/chartAccountsModel.js");
const TransactionVoucher = require("../../models/Finance/transactionEntry.js");
const JournalVoucher = require('../../models/Finance/journalVoucherModel.js');

const save = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { accountTitle, bankName, accountNumber, openingBalance } = req.body;

    if (!accountTitle || !bankName || !accountNumber || openingBalance === undefined) {
      throw new Error('All fields are required');
    }

    // Create linked chart account
    let bankParent = await ChartAccount.findOne({ name: { $regex: /^Bank$/i }, parentAccount: null }).session(session);
    if (!bankParent) {
      bankParent = new ChartAccount({
        code: `BANK-${Date.now()}`,
        name: 'Bank',
        group: 'Assets',
        category: 'Current Asset',
        openingBalance: 0,
      });
      await bankParent.save({ session });
    }

    const childAccount = new ChartAccount({
      code: `BANK-${accountNumber.slice(-4)}-${Date.now()}`,
      name: bankName,
      group: 'Assets',
      category: 'Current Asset',
      parentAccount: bankParent._id,
      openingBalance: openingBalance || 0,
      currentBalance: openingBalance || 0,
    });
    await childAccount.save({ session }); const newBank = new BankAccount({
      accountTitle,
      bankName,
      accountNumber,
      openingBalance,
      currentBalance: openingBalance || 0,
      chartAccountId: childAccount._id,
    });
    await newBank.save({ session });

    // Create opening balance journal
    if (openingBalance !== 0) {
      const equityAccount = await ChartAccount.findOne({ category: 'Retained Earnings' }).session(session);
      if (!equityAccount) throw new Error('Retained Earnings account not found');

     
    }

    await session.commitTransaction();
    res.json({ success: true, message: 'Bank account added', data: newBank });
  } catch (error) {
    await session.abortTransaction();
    res.status(error.code === 11000 ? 400 : 500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};
const deleteBank = async (req, res) => {
  try {
    const { id } = req.params;  // Changed from req.body to req.params
    const deletedBank = await BankAccount.findByIdAndDelete(id);

    if (!deletedBank) {
      return res.json({ success: false, message: "BankAccount not found" });
    }

    return res.json({ success: true, message: "BankAccount deleted successfully" });
  } catch (error) {
    console.error("Error deleting bank:", error);
    return res.json({ success: false, message: "Server error", error });
  }
};

const deleteMultipleBanks = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.json({ success: false, message: "No bank IDs provided" });
    }

    const result = await BankAccount.deleteMany({ _id: { $in: ids } });

    if (result.deletedCount === 0) {
      return res.json({ success: false, message: "No banks were deleted" });
    }

    return res.json({
      success: true,
      message: `${result.deletedCount} banks deleted successfully`
    });
  } catch (error) {
    console.error("Error deleting banks:", error);
    return res.json({ success: false, message: "Server error", error });
  }
};

const update = async (req, res) => {
  try {
    const { id, accountTitle, bankName, accountNumber, openingBalance, chartAccountId } = req.body;
    const updatedData = {
      accountTitle,
      bankName,
      accountNumber,
      openingBalance: Number(openingBalance),
      currentBalance: Number(openingBalance), // Update currentBalance as well
      ...(chartAccountId && { chartAccountId }),
    };
    const updatedBank = await BankAccount.findByIdAndUpdate(id, updatedData, {
      new: true,
    });
    if (!updatedBank) {
      return res.status(404).json({ success: false, message: "Bank account not found" });
    }
    return res.json({ success: true, message: "Bank account updated successfully", data: updatedBank });
  } catch (error) {
    console.error("Error updating bank account:", error);
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "Account number already exists",
      });
    }
    res.status(500).json({ success: false, message: "Server error", error: error.message });
  }
};

const view = async (req, res) => {
  const { all } = req.query;

  try {
    if (all === "true") {
      const bankList = await BankAccount.find({}).populate("chartAccountId", "name");
      return res.json({
        success: true,
        totalBanks: bankList.length,
        bankList,
      });
    } else {
      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;

      const totalBanks = await BankAccount.countDocuments();
      const bankList = await BankAccount.find({})
        .skip(skip)
        .limit(limit)
        .populate("chartAccountId", "name");

      return res.json({
        success: true,
        totalBanks,
        totalPages: Math.ceil(totalBanks / limit),
        currentPage: page,
        bankList,
      });
    }
  } catch (error) {
    console.error("Error fetching bank accounts:", error);
    res.status(500).json({ success: false, message: "Error fetching bank account records", error: error.message });
  }
};
// Total Cash (from COA) and Bank (from BankAccount) summary
const getBankLedger = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const bankAccount = await BankAccount.findById(id).populate('chartAccountId').lean();
    if (!bankAccount) return res.status(404).json({ success: false, message: 'Bank account not found' });

    const filter = { bankAccount: id, status: 'Posted' };
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const vouchers = await TransactionVoucher.find(filter).sort({ date: 1 }).lean();
    let runningBalance = bankAccount.openingBalance || 0;

    const ledgerEntries = vouchers.map(voucher => {
      const isReceipt = voucher.voucherType === 'Receipt';
      const amount = voucher.totalAmount;
      runningBalance += isReceipt ? amount : -amount;
      return {
        date: voucher.date,
        type: voucher.voucherType,
        reference: voucher.voucherNumber || voucher.reference || '-',
        description: voucher.description || '-',
        debit: isReceipt ? amount : 0,
        credit: !isReceipt ? amount : 0,
        narration: voucher.description || '-',
        party: voucher.party,
        balance: runningBalance,
      };
    });

    res.status(200).json({
      success: true,
      data: {
        accountInfo: {
          accountTitle: bankAccount.accountTitle,
          bankName: bankAccount.bankName,
          accountNumber: bankAccount.accountNumber,
          openingBalance: bankAccount.openingBalance,
        },
        entries: ledgerEntries,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const getCashAndBankSummary = async (req, res) => {
  try {
    // Cash: COA accounts with group 'Assets' and name including 'cash'
    const cashAccounts = await ChartAccount.find({
      group: 'Assets',
      name: { $regex: /cash/i },
    }).lean();
    const cashLedgers = await Promise.all(cashAccounts.map(async acc => {
      const ledger = await getLedgerForAccount(acc._id);
      return { name: acc.name, balance: ledger.length > 0 ? ledger[ledger.length - 1].balance : acc.openingBalance };
    }));
    const totalCash = cashLedgers.reduce((sum, acc) => sum + acc.balance, 0);

    // Bank: Use BankAccount model
    const bankAccounts = await BankAccount.find().populate('accountTitle').populate('bankName').populate('chartAccountId').lean();
    const bankLedgers = await Promise.all(bankAccounts.map(async bank => {
      const ledger = await getBankLedgerForAccount(bank._id);
      return { bankName: bank.bankName, balance: ledger.length > 0 ? ledger[ledger.length - 1].balance : bank.openingBalance };
    }));
    const totalBank = bankLedgers.reduce((sum, bank) => sum + bank.balance, 0);

    res.json({
      success: true,
      totalCash,
      totalBank,
      cashAccounts: cashLedgers,
      bankAccounts: bankLedgers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Helper function for ledger calculation
async function getLedgerForAccount(accountId) {
  const journalQuery = { 'accounts.account': accountId, status: 'Posted' };
  const transactionQuery = { $or: [{ 'accounts.chartAccount': accountId }, { cashAccount: accountId }], status: 'Posted' };
  const [journalEntries, transactionEntries] = await Promise.all([
    JournalVoucher.find(journalQuery).lean(),
    TransactionVoucher.find(transactionQuery).populate('bankAccount cashAccount accounts.chartAccount').lean(),
  ]);

  let runningBalance = (await ChartAccount.findById(accountId).lean()).openingBalance || 0;
  const ledger = [];

  for (const entry of journalEntries) {
    for (const line of entry.accounts) {
      if (line.account.toString() === accountId.toString()) {
        const debit = line.debitAmount || 0;
        const credit = line.creditAmount || 0;
        runningBalance += (['Assets', 'Expense'].includes((await ChartAccount.findById(accountId)).group) ? debit - credit : credit - debit);
        ledger.push({ date: entry.date, debit, credit, balance: runningBalance });
      }
    }
  }

  for (const txn of transactionEntries) {
    const isCashAccount = txn.cashAccount && txn.cashAccount._id.toString() === accountId.toString();
    for (const line of txn.accounts) {
      if (line.chartAccount._id.toString() === accountId.toString() || isCashAccount) {
        const debit = txn.voucherType === 'Receipt' && !isCashAccount ? line.amount : (txn.voucherType === 'Receipt' && isCashAccount ? txn.totalAmount : 0);
        const credit = txn.voucherType === 'Payment' && !isCashAccount ? line.amount : (txn.voucherType === 'Payment' && isCashAccount ? txn.totalAmount : 0);
        runningBalance += (['Assets', 'Expense'].includes((await ChartAccount.findById(accountId)).group) ? debit - credit : credit - debit);
        ledger.push({ date: txn.date, debit, credit, balance: runningBalance });
      }
    }
  }

  return ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
}

async function getBankLedgerForAccount(bankId) {
  const vouchers = await TransactionVoucher.find({ bankAccount: bankId, status: 'Posted' }).sort({ date: 1 }).lean();
  let runningBalance = (await BankAccount.findById(bankId).lean()).openingBalance || 0;
  return vouchers.map(voucher => {
    const isReceipt = voucher.voucherType === 'Receipt';
    const amount = voucher.totalAmount;
    runningBalance += isReceipt ? amount : -amount;
    return { date: voucher.date, debit: isReceipt ? amount : 0, credit: !isReceipt ? amount : 0, balance: runningBalance };
  });
}
module.exports = {
  save, deleteBank, deleteMultipleBanks, update, view, getCashAndBankSummary, getBankLedger
};