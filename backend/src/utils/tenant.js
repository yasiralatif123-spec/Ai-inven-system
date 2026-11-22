const mongoose = require("mongoose");

function resolveBusinessId(req) {
  const raw = req?.auth?.businessId || req?.user?.businessId || null;
  if (!raw) return null;
  const value = String(raw);
  return mongoose.Types.ObjectId.isValid(value) ? value : null;
}

function notFoundError(message = "Not found") {
  const error = new Error(message);
  error.statusCode = 404;
  return error;
}

function tenantFilter(req, extra = {}) {
  const businessId = resolveBusinessId(req);
  if (!businessId) {
    throw notFoundError();
  }
  return { ...extra, businessId };
}

async function findOwned(Model, id, req) {
  const businessId = resolveBusinessId(req);
  if (!businessId || !mongoose.Types.ObjectId.isValid(String(id))) {
    return null;
  }
  return Model.findOne({ _id: id, businessId });
}

async function assertOwned(Model, id, req) {
  const doc = await findOwned(Model, id, req);
  if (!doc) {
    throw notFoundError();
  }
  return doc;
}

module.exports = {
  resolveBusinessId,
  tenantFilter,
  findOwned,
  assertOwned,
};
