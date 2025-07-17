const ChartAccount = require('../models/Finance/chartAccountsModel');


async function updateRetainedEarnings(accountId, amount, type, session) {
    const account = await ChartAccount.findById(accountId).session(session);
    if (!account || !['Income', 'Expense'].includes(account.group)) return;

    let retainedEarnings = await ChartAccount.findOne({ category: 'Retained Earnings' }).session(session);

    if (!retainedEarnings) {
        // Create Retained Earnings account if it doesn't exist
        retainedEarnings = new ChartAccount({
            name: 'Retained Earnings',
            group: 'Equity',
            category: 'Retained Earnings',
            nature: 'Credit',
            currentBalance: 0,
            createdBy: 'system',
        });
        await retainedEarnings.save({ session });
    }

    // Update balance
    retainedEarnings.currentBalance += type === 'Income' ? amount : -amount;
    await retainedEarnings.save({ session });

    // Recalculate parent balances if applicable
    await retainedEarnings.calculateAndUpdateParentBalance(session);
}

module.exports = { updateRetainedEarnings };
