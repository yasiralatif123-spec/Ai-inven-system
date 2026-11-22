module.exports = {
  testEnvironment: "node",
  setupFiles: ["<rootDir>/test/setup.js"],
  testMatch: ["<rootDir>/test/**/*.test.js"],
  clearMocks: true,
  testTimeout: 20000,
  coverageDirectory: "coverage",
  collectCoverageFrom: [
    "src/**/*.js",
    "!src/server.js",
    "!src/config/cloudinary.js",
  ],
};
