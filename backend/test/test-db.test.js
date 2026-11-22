const mongoose = require("mongoose");
const {
  connectTestDB,
  resolveTestDatabase,
  databaseNameFromUri,
} = require("./helpers/test-db");

describe("test database safety guard", () => {
  const originalTestUri = process.env.MONGODB_TEST_URI;
  const originalProdUri = process.env.MONGODB_URI;

  afterEach(() => {
    if (originalTestUri === undefined) delete process.env.MONGODB_TEST_URI;
    else process.env.MONGODB_TEST_URI = originalTestUri;
    if (originalProdUri === undefined) delete process.env.MONGODB_URI;
    else process.env.MONGODB_URI = originalProdUri;
  });

  test("extracts the database name from a URI", () => {
    expect(databaseNameFromUri("mongodb://localhost:27017/inv_system_test")).toBe(
      "inv_system_test"
    );
  });

  test("requires MONGODB_TEST_URI", () => {
    delete process.env.MONGODB_TEST_URI;
    expect(() => resolveTestDatabase()).toThrow(/MONGODB_TEST_URI is required/);
  });

  test("refuses a database name without 'test'", () => {
    process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/inv_system";
    expect(() => resolveTestDatabase()).toThrow(/must contain "test"/);
  });

  test("refuses the production database", () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/inv_system_test";
    process.env.MONGODB_TEST_URI = "mongodb://localhost:27017/inv_system_test";
    expect(() => resolveTestDatabase()).toThrow(/same database/);
  });

  test("accepts a dedicated test database", () => {
    process.env.MONGODB_URI = "mongodb://localhost:27017/inv_system";
    process.env.MONGODB_TEST_URI =
      "mongodb://127.0.0.1:27019/inv_system_test";
    expect(resolveTestDatabase()).toEqual({
      uri: "mongodb://127.0.0.1:27019/inv_system_test",
      dbName: "inv_system_test",
    });
  });
});

describe("connectTestDB failure behavior", () => {
  test("uses a short timeout and reports connection failures without credentials", async () => {
    const originalTestUri = process.env.MONGODB_TEST_URI;
    process.env.MONGODB_TEST_URI =
      "mongodb://testuser:supersecret@127.0.0.1:27019/inv_system_test";
    const connect = jest
      .spyOn(mongoose, "connect")
      .mockRejectedValue(new Error("ECONNREFUSED"));

    try {
      await expect(connectTestDB()).rejects.toThrow(
        /Could not connect to test MongoDB.*within 3000ms/
      );
      expect(connect).toHaveBeenCalledWith(
        "mongodb://testuser:supersecret@127.0.0.1:27019/inv_system_test",
        expect.objectContaining({
          dbName: "inv_system_test",
          serverSelectionTimeoutMS: 3000,
        })
      );

      let message = "";
      try {
        await connectTestDB();
      } catch (error) {
        message = error.message;
      }
      expect(message).not.toContain("supersecret");
      expect(message).toContain("127.0.0.1:27019");
    } finally {
      connect.mockRestore();
      if (originalTestUri === undefined) delete process.env.MONGODB_TEST_URI;
      else process.env.MONGODB_TEST_URI = originalTestUri;
    }
  });
});
