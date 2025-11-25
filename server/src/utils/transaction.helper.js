const mongoose = require('mongoose');

/**
 * Run a set of database operations inside a MongoDB transaction.
 * @param {function(session: mongoose.ClientSession): Promise<any>} operations - A callback that receives the session and performs DB actions.
 * @returns {Promise<any>} Result of the operations callback.
 */
async function runInTransaction(operations) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        const result = await operations(session);
        await session.commitTransaction();
        session.endSession();
        return result;
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        throw err;
    }
}

module.exports = { runInTransaction };
