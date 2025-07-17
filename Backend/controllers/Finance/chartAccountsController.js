const mongoose = require('mongoose');
const ChartAccount = require("../../models/Finance/chartAccountsModel.js");
const TransactionVoucher = require("../../models/Finance/transactionEntry.js");
const JournalVoucher = require("../../models/Finance/journalVoucherModel.js");
const sanitize = require('mongo-sanitize');
const COALedger = require("../../models/Finance/coaLedger");

// Helper function to generate account code
const generateAccountCode = async (group, category, session) => {
  const prefixes = {
    'Assets': '1',
    'Liabilities': '2',
    'Equity': '3',
    'Income': '4',
    'Expense': '5'
  };

  const prefix = prefixes[group];
  if (!prefix) throw new Error('Invalid account group');

  const lastAccount = await ChartAccount
    .findOne({ group, code: { $regex: `^${prefix}` } })
    .sort({ code: -1 })
    .session(session);

  if (!lastAccount || !lastAccount.code) {
    return `${prefix}0001`;
  }

  const lastNumber = parseInt(lastAccount.code.slice(1));
  return `${prefix}${(lastNumber + 1).toString().padStart(4, '0')}`;
};

// Helper function to update parent account balance
const updateParentBalance = async (parentId, session) => {
  const parent = await ChartAccount.findById(parentId).session(session);
  if (parent) {
    const childAccounts = await ChartAccount.find({ parentAccount: parentId }).session(session);
    const totalBalance = childAccounts.reduce((sum, child) => sum + (child.currentBalance || 0), 0);
    parent.currentBalance = totalBalance;
    parent.openingBalance = 0; // Parent accounts should not have their own opening balance
    await parent.save({ session });

    // Recursively update grandparent if exists
    if (parent.parentAccount) {
      await updateParentBalance(parent.parentAccount, session);
    }
  }
};

exports.createChartAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { name, group, category, parentAccount, openingBalance, openingDate } = req.body;

    if (!name || !group) {
      throw new Error('name and group are required');
    }

    let accountData = {
      name: sanitize(name.trim()),
      group,
      openingBalance: parentAccount ? (parseFloat(openingBalance) || 0) : 0,
      openingDate: openingDate ? new Date(openingDate) : new Date(),
      currentBalance: parentAccount ? (parseFloat(openingBalance) || 0) : 0,
    };

    if (parentAccount) {
      const parent = await ChartAccount.findById(parentAccount).session(session);
      if (!parent) throw new Error('Parent account not found');
      accountData.group = parent.group;
      accountData.category = parent.category;
      accountData.nature = parent.nature;
      accountData.parentAccount = parentAccount;

      const latestSubAccount = await ChartAccount
        .findOne({ parentAccount: parent._id })
        .sort({ code: -1 })
        .session(session);

      let subAccountNum = '01';
      if (latestSubAccount && latestSubAccount.code) {
        const lastNum = parseInt(latestSubAccount.code.split('-').pop());
        subAccountNum = (lastNum + 1).toString().padStart(2, '0');
      }
      accountData.code = `${parent.code}-${subAccountNum}`;
    } else {
      if (!category) {
        throw new Error('Category is required for main accounts');
      }
      accountData.category = category;
      accountData.code = await generateAccountCode(group, category, session);
    }

    const newAccount = new ChartAccount(accountData);
    await newAccount.save({ session });

    // Update parent balance if this is a child account
    if (parentAccount) {
      await updateParentBalance(parentAccount, session);
    }



    await session.commitTransaction();
    res.status(201).json({ success: true, message: 'Account created', data: newAccount });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Get All Accounts
exports.getAllAccounts = async (req, res) => {
  try {
    const { forDropdown, group } = req.query;
    let accounts = await ChartAccount.find(group ? { group } : {})
      .populate("parentAccount", "name group")
      .sort({ group: 1, name: 1 })
      .lean();

    if (forDropdown === 'true') {
      // Structure accounts for dropdown
      const groupedAccounts = [];
      const parentMap = {};

      // First pass: Identify parents and initialize groups
      accounts.forEach(acc => {
        if (!acc.parentAccount) {
          parentMap[acc._id.toString()] = {
            label: `${acc.name} - ${acc.group}`,
            value: acc._id.toString(),
            disabled: true, // Parent is not selectable
            children: []
          };
        }
      });

      // Second pass: Add children to their parents or as standalone if no parent
      accounts.forEach(acc => {
        const accId = acc._id.toString();
        if (acc.parentAccount) {
          const parentId = acc.parentAccount._id.toString();
          if (parentMap[parentId]) {
            parentMap[parentId].children.push({
              value: accId,
              label: acc.name,
              disabled: false // Child is selectable
            });
          }
        } else if (!Object.values(parentMap).some(p => p.children.some(c => c.value === accId))) {
          // Handle accounts that are not parents but have no parent (standalone child-like accounts)
          groupedAccounts.push({
            value: accId,
            label: acc.name,
            disabled: false
          });
        }
      });

      // Convert parentMap to array and include parents with children
      Object.values(parentMap).forEach(parent => {
        if (parent.children.length > 0) {
          groupedAccounts.push(parent);
          groupedAccounts.push(...parent.children);
        }
      });

      return res.status(200).json({ success: true, data: groupedAccounts });
    }

    // Original response for non-dropdown requests
    const accountsWithBalances = accounts.map(acc => ({
      ...acc,
      balance: acc.currentBalance,
      formattedBalance: acc.currentBalance.toLocaleString('en-US', {
        style: 'currency',
        currency: 'PKR'
      })
    }));

    res.status(200).json({ success: true, data: accountsWithBalances });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch accounts", error: error.message });
  }
};

exports.getCashAccounts = async (req, res) => {
  try {
    // Case-insensitive match for any account with "cash" in the name
    const cashAccountsList = await ChartAccount.find({
      name: { $regex: /cash/i }, group: 'Assets',
    }).lean();

    if (cashAccountsList.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No accounts found containing the word 'cash'.",
      });
    }

    return res.status(200).json({
      success: true,
      data: cashAccountsList,
    });
  } catch (error) {
    console.error("Error in getCashAccounts:", error);
    res.status(500).json({
      success: false,
      message: "Server error while fetching cash accounts.",
      error: error.message,
    });
  }
};


// Get a single account by ID
exports.getAccountById = async (req, res) => {
  try {
    const { id } = req.params;
    const account = await ChartAccount.findById(id).populate('parentAccount', 'name').lean();

    if (!account) {
      return res.status(404).json({ success: false, message: 'Account not found' });
    }

    res.status(200).json({ success: true, data: account });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch account', error: error.message });
  }
};

// Update an account
exports.updateAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    const { name, openingBalance, openingDate } = req.body;

    const account = await ChartAccount.findById(id).session(session);
    if (!account) {
      throw new Error('Account not found');
    }

    if (name) account.name = sanitize(name.trim());
    if (account.parentAccount && openingBalance !== undefined) {
      const oldOpeningBalance = account.openingBalance;
      account.openingBalance = parseFloat(openingBalance);
      account.currentBalance += (account.openingBalance - oldOpeningBalance);
    }
    if (openingDate) account.openingDate = new Date(openingDate);

    await account.save({ session });

    // Update parent balance if this is a child account
    if (account.parentAccount) {
      await updateParentBalance(account.parentAccount, session);
    }

    // Update journal if opening balance changed
   
    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Account updated successfully', data: account });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// Delete an account
exports.deleteAccount = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;

    const hasChildren = await ChartAccount.findOne({ parentAccount: id }).session(session);
    if (hasChildren) {
      throw new Error('Cannot delete: sub-accounts exist');
    }
    const transactions = await Promise.all([
      TransactionVoucher.findOne({ $or: [{ 'accounts.chartAccount': id }, { cashAccount: id }] }).session(session),
      JournalVoucher.findOne({ 'accounts.account': id }).session(session)
    ]);

    if (transactions.some(t => t)) {
      throw new Error('Cannot delete account linked to transactions');
    }

    const account = await ChartAccount.findById(id).session(session);
    if (!account) {
      throw new Error('Account not found');
    }

    const parentId = account.parentAccount;
    await ChartAccount.findByIdAndDelete(id).session(session);

    // Update parent balance after deletion
    if (parentId) {
      await updateParentBalance(parentId, session);
    }
    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

// GET LEDGER of a Chart of Account
exports.getLedgerByCoaId = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const chartAccount = await ChartAccount.findById(id).lean();
    if (!chartAccount) return res.status(404).json({ success: false, message: 'Chart account not found' });

    const dateFilter = {};
    if (startDate) dateFilter.$gte = new Date(startDate);
    if (endDate) dateFilter.$lte = new Date(endDate);

    const journalQuery = { 'accounts.account': id, status: 'Posted', ...(startDate || endDate ? { date: dateFilter } : {}) };
    const transactionQuery = { $or: [{ 'accounts.chartAccount': id }, { cashAccount: id }], status: 'Posted', ...(startDate || endDate ? { date: dateFilter } : {}) };

    const [journalEntries, transactionEntries] = await Promise.all([
      JournalVoucher.find(journalQuery).lean(),
      TransactionVoucher.find(transactionQuery).populate('bankAccount cashAccount accounts.chartAccount').lean(),
    ]);

    let runningBalance = chartAccount.openingBalance || 0;
    const ledger = [];

    for (const entry of journalEntries) {
      for (const line of entry.accounts) {
        if (line.account.toString() === id) {
          const debit = line.debitAmount || 0;
          const credit = line.creditAmount || 0;
          runningBalance += chartAccount.nature === 'Debit' ? debit - credit : credit - debit;
          ledger.push({
            date: entry.date,
            type: 'Journal',
            reference: entry.reference || '-',
            description: entry.description || '-',
            debit,
            credit,
            narration: line.narration || '-',
            balance: runningBalance,
          });
        }
      }
    }

    for (const txn of transactionEntries) {
      const isCashAccount = txn.cashAccount && txn.cashAccount._id.toString() === id;
      for (const line of txn.accounts) {
        if (line.chartAccount._id.toString() === id || isCashAccount) {
          const debit = txn.voucherType === 'Receipt' && !isCashAccount ? line.amount : (txn.voucherType === 'Receipt' && isCashAccount ? txn.totalAmount : 0);
          const credit = txn.voucherType === 'Payment' && !isCashAccount ? line.amount : (txn.voucherType === 'Payment' && isCashAccount ? txn.totalAmount : 0);
          runningBalance += chartAccount.nature === 'Debit' ? debit - credit : credit - debit;
          ledger.push({
            date: txn.date,
            type: txn.voucherType,
            reference: txn.voucherNumber || txn.reference || '-',
            description: txn.description || '-',
            debit,
            credit,
            narration: line.narration || '-',
            party: txn.party,
            via: txn.paymentMethod === 'Bank' ? txn.bankAccount?.bankName : txn.cashAccount?.name,
            balance: runningBalance
          });
        }
      }
    }

    ledger.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ success: true, account: chartAccount.name, openingBalance: chartAccount.openingBalance, ledger });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// New Updated Ledger Controller
exports.getLedgerEntries = async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;
    console.log(`[${new Date().toISOString()}] getLedgerEntries: coaId=${id}, startDate=${startDate}, endDate=${endDate}`);

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid COA ID" });
    }

    // Fetch the account to check if it's a parent
    const account = await ChartAccount.findById(id);
    if (!account) {
      return res.status(404).json({ success: false, message: "Account not found" });
    }

    // Check if the account has children
    const childAccounts = await account.getChildAccounts();
    const isParentAccount = childAccounts.length > 0;

    let ledgerEntries = [];
    let chartAccount = account;
    let formattedEntries = [];

    if (isParentAccount) {
      // For parent account, fetch ledger entries for all child accounts
      const childIds = childAccounts.map(child => child._id);
      let query = { coaId: { $in: childIds } };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      ledgerEntries = await COALedger.find(query)
        .populate('coaId', 'name')
        .sort({ date: -1 })
        .lean();

      formattedEntries = ledgerEntries.map(entry => ({
        id: entry._id,
        date: entry.date,
        debit: entry.debit,
        credit: entry.credit,
        balanceAfter: entry.balanceAfter,
        reference: entry.reference,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        description: entry.description,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
        childAccountName: entry.coaId ? entry.coaId.name : 'Unknown', // Add child account name
      }));
    } else {
      // For individual account, fetch its ledger entries
      let query = { coaId: id };
      if (startDate || endDate) {
        query.date = {};
        if (startDate) query.date.$gte = new Date(startDate);
        if (endDate) query.date.$lte = new Date(endDate);
      }

      ledgerEntries = await COALedger.find(query)
        .populate('coaId', 'name')
        .sort({ date: -1 })
        .lean();

      formattedEntries = ledgerEntries.map(entry => ({
        id: entry._id,
        date: entry.date,
        debit: entry.debit,
        credit: entry.credit,
        balanceAfter: entry.balanceAfter,
        reference: entry.reference,
        sourceType: entry.sourceType,
        sourceId: entry.sourceId,
        description: entry.description,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      }));
    }

    res.status(200).json({
      success: true,
      message: isParentAccount ? "Combined ledger entries for parent account retrieved successfully" : "Ledger entries retrieved successfully",
      data: {
        chartAccount: {
          id: chartAccount._id,
          name: chartAccount.name,
          group: chartAccount.group,
          openingBalance: chartAccount.openingBalance || 0,
          currentBalance: chartAccount.currentBalance || 0,
        },
        entries: formattedEntries,
        isParentAccount, // Flag to indicate if it's a parent account
      },
    });
  } catch (error) {
    console.error(`[${new Date().toISOString()}] getLedgerEntries: Error`, { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  }
};