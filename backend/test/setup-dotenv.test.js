const fs = require("fs");
const path = require("path");
const { execFileSync } = require("child_process");
const dotenv = require("dotenv");

const backendDir = path.join(__dirname, "..");
const envPath = path.join(backendDir, ".env");
const setupPath = path.join(__dirname, "setup.js");

describe("Jest setup loads backend/.env", () => {
  test("MONGODB_TEST_URI is read from .env when the shell does not export it", () => {
    if (!fs.existsSync(envPath)) {
      throw new Error(
        "backend/.env must exist and define MONGODB_TEST_URI for this test."
      );
    }

    const fromEnvFile = dotenv.parse(fs.readFileSync(envPath)).MONGODB_TEST_URI;
    expect(fromEnvFile).toBeTruthy();

    // Run the real setup file in a clean child process with the variable removed,
    // so this proves .env loading rather than an inherited shell value.
    const childEnv = { ...process.env };
    delete childEnv.MONGODB_TEST_URI;

    const script = `
      require(${JSON.stringify(setupPath)});
      process.stdout.write(JSON.stringify({
        mongodbTestUri: process.env.MONGODB_TEST_URI || "",
        nodeEnv: process.env.NODE_ENV,
        authEnforcement: process.env.AUTH_ENFORCEMENT
      }));
    `;
    const output = execFileSync(process.execPath, ["-e", script], {
      cwd: backendDir,
      env: childEnv,
      encoding: "utf8",
    });
    const result = JSON.parse(output);

    expect(result.mongodbTestUri).toBe(fromEnvFile);
    expect(result.nodeEnv).toBe("test");
    expect(result.authEnforcement).toBe("false");
  });
});
