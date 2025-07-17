const mongoose = require("mongoose");
const ChartAccount = require("../../models/Finance/chartAccountsModel.js");
const TransactionVoucher = require("../../models/Finance/transactionEntry.js");
const BankAccount = require("../../models/Finance/bankAccountModel.js");
const AuditLog = require("../../models/Finance/auditLogModel.js");
const Period = require("../../models/Finance/periodModel.js");
const Customer = require("../../models/Inventory/customerModel.js");
const Supplier = require("../../models/Inventory/supplierModel.js");
const { updateRetainedEarnings } = require("../../utils/accounting.js");
const errorMessages = require("../../utils/errorMessages.js");
const Joi = require('joi');
const sanitize = require('mongo-sanitize');
const { createCOALedgerEntry } = require("../../utils/coaLedger.js");

const transactionSchema = Joi.object({
  date: Joi.date().required().error(new Error(errorMessages.invalidDate)),
  reference: Joi.string().max(50).allow('').optional(),
  voucherType: Joi.string().valid('Payment', 'Receipt').required().error(new Error(errorMessages.missingFields)),
  paymentMethod: Joi.string().valid('Cash', 'Bank').required().error(new Error(errorMessages.invalidPaymentMethod)),
  bankAccount: Joi.string().when('paymentMethod', { is: 'Bank', then: Joi.string().required(), otherwise: Joi.forbidden() }),
  transactionNumber: Joi.string().max(50).allow('').optional(),
  clearanceDate: Joi.date().optional(),
  cashAccount: Joi.string().when('paymentMethod', { is: 'Cash', then: Joi.string().required(), otherwise: Joi.forbidden() }),
  party: Joi.string().valid('Customer', 'Supplier', 'Other').required().error(new Error(errorMessages.missingFields)),
  customer: Joi.string().when('party', { is: 'Customer', then: Joi.string().required(), otherwise: Joi.forbidden() }),
  supplier: Joi.string().when('party', { is: 'Supplier', then: Joi.string().required(), otherwise: Joi.forbidden() }),
  description: Joi.string().max(200).allow('').optional(),
  accounts: Joi.array().min(1).items(
    Joi.object({
      chartAccount: Joi.string().required().error(new Error(errorMessages.invalidAccount)),
      amount: Joi.number().positive().required().error(new Error(errorMessages.invalidAmount)),
      narration: Joi.string().allow('').optional()
    })
  ).required().error(new Error(errorMessages.missingFields)),
  totalAmount: Joi.number().positive().required().error(new Error(errorMessages.invalidAmount)),
  status: Joi.string().valid('Draft', 'Posted').default('Draft')
});

const updateAccountBalance = async (accountId, debitAmount, creditAmount, session) => {
  const account = await ChartAccount.findById(accountId).session(session);
  if (!account) throw new Error(errorMessages.accountNotFound);

  const isDebitNature = ['Assets', 'Expense'].includes(account.group);
  const isCreditNature = ['Liabilities', 'Equity', 'Income'].includes(account.group);

  if (!isDebitNature && !isCreditNature) {
    throw new Error(errorMessages.invalidAccount);
  }

  let balanceChange = isDebitNature
    ? (debitAmount || 0) - (creditAmount || 0)
    : (creditAmount || 0) - (debitAmount || 0);

  account.currentBalance = (account.currentBalance || 0) + balanceChange;
  await account.save({ session });

  await account.calculateAndUpdateParentBalance(session);
};

const updatePartyTransactionHistory = async (voucher, session) => {
  if (voucher.party === 'Customer' && voucher.customer) {
    const customer = await Customer.findById(voucher.customer).session(session);
    if (!customer) throw new Error('Customer not found');

    const amount = voucher.voucherType === 'Receipt' ? -voucher.totalAmount : voucher.totalAmount;
    customer.currentBalance += amount;

    customer.transactionHistory.push({
      date: voucher.date,
      type: 'Receipt',
      amount: voucher.totalAmount,
      reference: voucher.voucherNumber,
      description: voucher.description || `${voucher.voucherType} transaction`,
      balance: customer.currentBalance
    });

    await customer.save({ session });
  } else if (voucher.party === 'Supplier' && voucher.supplier) {
    const supplier = await Supplier.findById(voucher.supplier).session(session);
    if (!supplier) throw new Error('Supplier not found');

    const amount = voucher.voucherType === 'Payment' ? -voucher.totalAmount : voucher.totalAmount;
    supplier.currentBalance += amount; // Fixed: Update currentBalance
    supplier.transactionHistory.push({ // Fixed: Changed supplierHistory to transactionHistory
      date: voucher.date,
      type: 'Payment',
      amount: voucher.totalAmount,
      reference: voucher.voucherNumber,
      description: voucher.description || '',
      balance: supplier.currentBalance
    });

    await supplier.save({ session });
  }
};

const add = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { error } = transactionSchema.validate(req.body, { abortEarly: false });
    if (error) throw new Error(error.details.map(d => d.message).join(', '));

    const sanitizedBody = sanitize(req.body);
    const {
      date,
      reference,
      voucherType,
      paymentMethod,
      bankAccount,
      transactionNumber,
      clearanceDate,
      cashAccount,
      party,
      customer,
      supplier,
      description,
      accounts,
      totalAmount,
      status
    } = sanitizedBody;
    console.log('sanitizedBody', sanitizedBody);
    const parsedDate = new Date(date);
    const closedPeriod = await Period.findOne({ endDate: { $gte: parsedDate }, status: 'closed' }).session(session);
    if (closedPeriod) throw new Error(errorMessages.closedPeriod);

    const accountIds = accounts.map(acc => acc.chartAccount);
    if (new Set(accountIds).size !== accountIds.length) {
      throw new Error(errorMessages.duplicateAccounts);
    }

    const accountsTotal = accounts.reduce((sum, acc) => sum + acc.amount, 0);
    if (accountsTotal !== totalAmount) {
      throw new Error(errorMessages.unbalancedEntry);
    }

    let cashChartAccount = null;
    let bank = null;
    if (paymentMethod === 'Cash') {
      cashChartAccount = await ChartAccount.findById(cashAccount).session(session);
      if (!cashChartAccount || cashChartAccount.group !== 'Assets' || !cashChartAccount.name.match(/cash/i)) {
        throw new Error(errorMessages.invalidAccount);
      }
      if (voucherType === 'Payment' && cashChartAccount.currentBalance < totalAmount) {
        throw new Error(errorMessages.insufficientBalance);
      }
    } else {
      bank = await BankAccount.findById(bankAccount).session(session);
      if (!bank) throw new Error('Bank account not found');
      if (voucherType === 'Payment' && bank.currentBalance < totalAmount) {
        throw new Error(errorMessages.insufficientBalance);
      }
    }

    const chartAccounts = await ChartAccount.find({ _id: { $in: accountIds } }).session(session);
    if (chartAccounts.length !== accountIds.length) {
      throw new Error(errorMessages.accountNotFound);
    }

    const voucherData = {
      date: parsedDate,
      reference: reference || undefined,
      voucherType,
      paymentMethod,
      party,
      customer: party === 'Customer' ? customer : undefined,
      supplier: party === 'Supplier' ? supplier : undefined,
      description: description || undefined,
      totalAmount,
      status: status || 'Draft',
      accounts,
    };

    if (paymentMethod === 'Cash') {
      voucherData.cashAccount = cashAccount;
    } else {
      voucherData.bankAccount = bankAccount;
      voucherData.transactionNumber = transactionNumber || undefined;
      voucherData.clearanceDate = clearanceDate || undefined;
    }

    const voucher = new TransactionVoucher(voucherData);
    await voucher.save({ session });

    if (status === 'Posted') {
      const journalAccounts = [];
      const ledgerEntries = [];

      if (paymentMethod === 'Cash') {
        journalAccounts.push({
          account: cashChartAccount._id,
          debitAmount: voucherType === 'Receipt' ? totalAmount : 0,
          creditAmount: voucherType === 'Payment' ? totalAmount : 0,
        });
        ledgerEntries.push(createCOALedgerEntry({
          coaId: cashChartAccount._id,
          date: parsedDate,
          debit: voucherType === 'Receipt' ? totalAmount : 0,
          credit: voucherType === 'Payment' ? totalAmount : 0,
          reference: `TXN-${voucher.voucherNumber}`,
          sourceType: 'Payment Voucher',
          sourceId: voucher._id,
          description: `${voucherType} for ${party}`,
          session,
          createdBy: req.user?.id || 'system',
        }));
      } else {
        journalAccounts.push({
          account: bank.chartAccountId,
          debitAmount: voucherType === 'Receipt' ? totalAmount : 0,
          creditAmount: voucherType === 'Payment' ? totalAmount : 0,
        });
        ledgerEntries.push(createCOALedgerEntry({
          coaId: bank.chartAccountId,
          date: parsedDate,
          debit: voucherType === 'Receipt' ? totalAmount : 0,
          credit: voucherType === 'Payment' ? totalAmount : 0,
          reference: `TXN-${voucher.voucherNumber}`,
          sourceType: 'Payment Voucher',
          sourceId: voucher._id,
          description: `${voucherType} for ${party}`,
          session,
          createdBy: req.user?.id || 'system',
        }));
      }

      for (const acc of accounts) {
        const chartAccount = chartAccounts.find(ca => ca._id.toString() === acc.chartAccount.toString());
        journalAccounts.push({
          account: acc.chartAccount,
          debitAmount: voucherType === 'Payment' ? acc.amount : 0,
          creditAmount: voucherType === 'Receipt' ? acc.amount : 0,
        });
        ledgerEntries.push(createCOALedgerEntry({
          coaId: acc.chartAccount,
          date: parsedDate,
          debit: voucherType === 'Payment' ? acc.amount : 0,
          credit: voucherType === 'Receipt' ? acc.amount : 0,
          reference: `TXN-${voucher.voucherNumber}`,
          sourceType: 'Payment Voucher',
          sourceId: voucher._id,
          description: `${voucherType} for ${party}`,
          session,
          createdBy: req.user?.id || 'system',
        }));
        if (['Income', 'Expense'].includes(chartAccount.group)) {
          await updateRetainedEarnings(acc.chartAccount, acc.amount, chartAccount.group, session);
        }
      }



      const updatePromises = [];
      if (paymentMethod === 'Cash') {
        updatePromises.push(updateAccountBalance(
          cashAccount,
          voucherType === 'Receipt' ? totalAmount : 0,
          voucherType === 'Payment' ? totalAmount : 0,
          session
        ));
      } else if (paymentMethod === 'Bank' && bank) {
        updatePromises.push(updateAccountBalance(
          bank.chartAccountId,
          voucherType === 'Receipt' ? totalAmount : 0,
          voucherType === 'Payment' ? totalAmount : 0,
          session
        ));
      }

      for (const acc of accounts) {
        updatePromises.push(updateAccountBalance(
          acc.chartAccount,
          voucherType === 'Payment' ? acc.amount : 0,
          voucherType === 'Receipt' ? acc.amount : 0,
          session
        ));
      }
      await Promise.all([...ledgerEntries, ...updatePromises]);

      if (paymentMethod === 'Bank' && bank) {
        bank.currentBalance += voucherType === 'Receipt' ? totalAmount : -totalAmount;
        await bank.save({ session });
      }

      await updatePartyTransactionHistory(voucher, session);
    }

    await AuditLog.create([{
      action: 'create',
      entity: 'TransactionVoucher',
      entityId: voucher._id,
      changes: sanitizedBody,
      timestamp: new Date(),
      userId: req.user?.id || 'system',
    }], { session });

    await session.commitTransaction();
    res.status(201).json({ success: true, message: `${voucherType} voucher created`, data: voucher });
  } catch (error) {
    await session.abortTransaction();
    console.error(`[${new Date().toISOString()}] add: Error`, { error: error.message });
    res.status(400).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

const view = async (req, res) => {
  const { page = 1, limit = 10, search, startDate, endDate, status, voucherType } = req.query;

  try {
    const query = {};
    if (search) {
      query.$or = [
        { reference: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { party: { $regex: search, $options: "i" } },
        { voucherNumber: { $regex: search, $options: "i" } },
      ];
    }
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    if (status) query.status = status;
    if (voucherType) query.voucherType = voucherType;

    const total = await TransactionVoucher.countDocuments(query);
    const vouchers = await TransactionVoucher.find(query)
      .populate("accounts.chartAccount", "name group")
      .populate("bankAccount", "bankName accountNumber")
      .populate("cashAccount", "name")
      .populate("customer", "name")
      .populate("supplier", "name")
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    return res.json({
      success: true,
      total,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      data: vouchers,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: errorMessages.missingFields,
    });
  }
};

const update = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { voucherId, status, } = req.body;

    const voucher = await TransactionVoucher.findById(voucherId).session(session);
    if (!voucher) throw new Error('Voucher not found');

    // Prevent changing from Posted to Draft
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

    await voucher.save({ session });

    // Fix: Pass document as an array for AuditLog.create
    await AuditLog.create([{
      action: 'update',
      entity: 'TransactionVoucher',
      entityId: voucher._id,
      changes: status ? { status } : {},
      timestamp: new Date()
    }], { session });

    await session.commitTransaction();
    res.json({
      success: true,
      message: "Voucher updated successfully",
      data: voucher
    });
  } catch (error) {
    await session.abortTransaction();
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};

const remove = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { id } = req.params;
    console.log(`Removing voucher with ID: ${id}`);

    await TransactionVoucher.findByIdAndDelete(id).session(session);


    await session.commitTransaction();
    res.status(200).json({ success: true, message: 'Invoice deleted successfully' });
  } catch (error) {
    await session.abortTransaction();
    res.status(500).json({ success: false, message: error.message });
  } finally {
    session.endSession();
  }
};

module.exports = { add, view, update, remove };