const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Product = require("../src/models/Product");

function parseArgs(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (!arg.startsWith("--")) continue;
    const equalsAt = arg.indexOf("=");
    if (equalsAt !== -1) {
      result[arg.slice(2, equalsAt)] = arg.slice(equalsAt + 1);
    } else if (argv[index + 1] && !argv[index + 1].startsWith("--")) {
      result[arg.slice(2)] = argv[index + 1];
      index += 1;
    } else {
      result[arg.slice(2)] = "true";
    }
  }
  return result;
}

function databaseNameFromUri(uri) {
  try {
    const parsed = new URL(uri);
    return parsed.pathname.replace(/^\//, "").split("/")[0] || null;
  } catch {
    return null;
  }
}

async function getProductIndexes() {
  try {
    return await Product.collection.indexes();
  } catch (error) {
    if (error?.codeName === "NamespaceNotFound") return [];
    throw error;
  }
}

function isOldGlobalSkuIndex(index) {
  return (
    index?.name === "sku_1" &&
    index?.unique === true &&
    index?.key &&
    Object.keys(index.key).length === 1 &&
    index.key.sku === 1
  );
}

function isCompoundBusinessSkuIndex(index) {
  return (
    index?.unique === true &&
    index?.key &&
    index.key.businessId === 1 &&
    index.key.sku === 1 &&
    Object.keys(index.key).length === 2
  );
}

async function runMigration(options = {}) {
  const dryRun = options.dryRun === true || options["dry-run"] === true;
  const confirm = options.confirm === true || options.confirm === "true";
  const uri = options.uri || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required to run migrate:indexes.");
  }

  const dbName = databaseNameFromUri(uri);
  console.log(`Target database: ${dbName || "<unknown>"} (${uri.replace(/\/\/([^@]+)@/, "//<redacted>@")})`);

  if (!dryRun && !confirm) {
    throw new Error(
      "Refusing to run a real index migration without --confirm. Use --dry-run to preview changes."
    );
  }

  const shouldConnect = mongoose.connection.readyState === 0;
  if (shouldConnect) {
    await mongoose.connect(uri);
  }

  try {
    const before = await getProductIndexes();
    const oldSku = before.find(isOldGlobalSkuIndex) || null;
    const compound = before.find(isCompoundBusinessSkuIndex) || null;

    console.log("\nBefore indexes (products):");
    for (const idx of before) {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? " unique" : ""}`);
    }

    const actions = [];
    if (oldSku) actions.push({ type: "drop", name: oldSku.name });
    if (!compound) actions.push({ type: "create", name: "businessId_1_sku_1" });

    if (actions.length === 0) {
      console.log("\nNo index changes needed.");
    } else {
      console.log(`\nPlanned actions (${dryRun ? "dry-run" : "real"}):`);
      for (const action of actions) {
        console.log(`  - ${action.type} ${action.name}`);
      }
    }

    const results = { droppedOldSku: false, createdCompound: false };

    if (!dryRun) {
      if (oldSku) {
        await Product.collection.dropIndex(oldSku.name);
        results.droppedOldSku = true;
        console.log(`Dropped index: ${oldSku.name}`);
      }
      if (!compound) {
        await Product.collection.createIndex(
          { businessId: 1, sku: 1 },
          { unique: true, name: "businessId_1_sku_1" }
        );
        results.createdCompound = true;
        console.log("Created index: businessId_1_sku_1");
      }
    }

    const after = dryRun ? before : await getProductIndexes();
    console.log(`\n${dryRun ? "After (dry-run, unchanged):" : "After:"}`);
    for (const idx of after) {
      console.log(`  - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? " unique" : ""}`);
    }

    return {
      dryRun,
      dbName,
      before,
      after,
      actions,
      results,
    };
  } finally {
    if (shouldConnect) {
      await mongoose.disconnect();
    }
  }
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const dryRun = options["dry-run"] === "true" || options.dryRun === "true";
  const confirm = options.confirm === "true";
  await runMigration({
    dryRun,
    confirm,
    uri: options.uri || process.env.MONGODB_URI,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`migrate:indexes failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  parseArgs,
  databaseNameFromUri,
  getProductIndexes,
  isOldGlobalSkuIndex,
  isCompoundBusinessSkuIndex,
};
