const ChartAccount = require('../models/Finance/chartAccountsModel');

async function updateRetainedEarnings(accountId, amount, type, session) {
    const account = await ChartAccount.findById(accountId).session(session);
    if (!account || !['Income', 'Expense'].includes(account.group)) return;

    const retainedEarnings = await ChartAccount.findOne({ category: 'Retained Earnings' }).session(session);
    if (!retainedEarnings) throw new Error('Retained Earnings account not found');

    retainedEarnings.currentBalance += type === 'Income' ? amount : -amount;
    await retainedEarnings.save({ session });
    await retainedEarnings.calculateAndUpdateParentBalance(session);
}

module.exports = { updateRetainedEarnings };