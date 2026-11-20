const mongoose = require("mongoose");

let transactionsSupported;

async function canUseTransactions() {
  if (transactionsSupported !== undefined) return transactionsSupported;

  try {
    const hello = await mongoose.connection.db.admin().command({ hello: 1 });
    transactionsSupported = Boolean(hello.setName || hello.msg === "isdbgrid");
  } catch (error) {
    transactionsSupported = false;
  }

  return transactionsSupported;
}

/**
 * Runs a multi-document change in a MongoDB transaction when the deployment
 * supports one. On standalone MongoDB it still provides a session, and callers
 * are responsible for compensating rollbacks.
 */
async function runWithSession(callback) {
  const useTransaction = await canUseTransactions();
  const session = await mongoose.startSession();

  try {
    if (useTransaction) session.startTransaction();
    const result = await callback(session, useTransaction);
    if (useTransaction) await session.commitTransaction();
    return result;
  } catch (error) {
    if (useTransaction) await session.abortTransaction().catch(() => {});
    throw error;
  } finally {
    session.endSession();
  }
}

module.exports = { runWithSession };
