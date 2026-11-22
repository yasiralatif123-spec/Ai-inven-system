const mongoose = require("mongoose");

// Fail fast when a test MongoDB is not running instead of waiting for the
// driver's much longer default server-selection window.
const TEST_SERVER_SELECTION_TIMEOUT_MS = 3000;

function redactUri(uri) {
  try {
    const parsed = new URL(uri);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return "<invalid MongoDB URI>";
  }
}

function databaseNameFromUri(uri) {
  if (!uri) return null;
  try {
    const parsed = new URL(uri);
    return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
  } catch {
    return null;
  }
}

function resolveTestDatabase() {
  const testUri = process.env.MONGODB_TEST_URI;
  if (!testUri) {
    throw new Error(
      "MONGODB_TEST_URI is required for tests. Point it at a dedicated database (e.g. mongodb://localhost:27017/inv_system_test)."
    );
  }

  const testDb = databaseNameFromUri(testUri);
  const prodDb = databaseNameFromUri(process.env.MONGODB_URI);

  if (!testDb) {
    throw new Error("MONGODB_TEST_URI must include an explicit database name.");
  }
  if (!/test/i.test(testDb)) {
    throw new Error(
      `Refusing to run tests against database "${testDb}". The test database name must contain "test".`
    );
  }
  if (prodDb && testDb === prodDb) {
    throw new Error(
      "MONGODB_TEST_URI resolves to the same database as MONGODB_URI. Refusing to run tests against production data."
    );
  }

  return { uri: testUri, dbName: testDb };
}

async function connectTestDB() {
  const { uri, dbName } = resolveTestDatabase();
  if (mongoose.connection.readyState !== 0) {
    throw new Error("Test database connection is already open.");
  }
  try {
    await mongoose.connect(uri, {
      dbName,
      maxPoolSize: 5,
      serverSelectionTimeoutMS: TEST_SERVER_SELECTION_TIMEOUT_MS,
    });
  } catch (error) {
    throw new Error(
      `Could not connect to test MongoDB at ${redactUri(uri)} (database "${dbName}") within ${TEST_SERVER_SELECTION_TIMEOUT_MS}ms. ` +
        `Start a local MongoDB on that address or fix MONGODB_TEST_URI in backend/.env. Original error: ${error.message}`
    );
  }
  return mongoose.connection;
}

async function clearTestDB() {
  const { collections } = mongoose.connection;
  await Promise.all(
    Object.values(collections).map((collection) => collection.deleteMany({}))
  );
}

async function disconnectTestDB() {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
}

module.exports = {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
  resolveTestDatabase,
  databaseNameFromUri,
};
