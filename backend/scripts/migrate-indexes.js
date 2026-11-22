const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const Customer = require("../src/models/Customer");
const Purchase = require("../src/models/Purchase");
const SaleOrder = require("../src/models/SaleOrder");

const TARGETS = [
  {
    key: "products",
    model: Product,
    oldIndex: { name: "sku_1", key: { sku: 1 } },
    newIndex: { name: "businessId_1_sku_1", key: { businessId: 1, sku: 1 } },
  },
  {
    key: "suppliers",
    model: Supplier,
    oldIndex: { name: "supplierCode_1", key: { supplierCode: 1 } },
    newIndex: { name: "businessId_1_supplierCode_1", key: { businessId: 1, supplierCode: 1 } },
  },
  {
    key: "customers",
    model: Customer,
    oldIndex: { name: "ledgerCode_1", key: { ledgerCode: 1 } },
    newIndex: { name: "businessId_1_ledgerCode_1", key: { businessId: 1, ledgerCode: 1 } },
  },
  {
    key: "purchases",
    model: Purchase,
    oldIndex: { name: "purchaseNumber_1", key: { purchaseNumber: 1 } },
    newIndex: { name: "businessId_1_purchaseNumber_1", key: { businessId: 1, purchaseNumber: 1 } },
  },
  {
    key: "saleorders",
    model: SaleOrder,
    oldIndex: { name: "orderNumber_1", key: { orderNumber: 1 } },
    newIndex: { name: "businessId_1_orderNumber_1", key: { businessId: 1, orderNumber: 1 } },
  },
];

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

async function getIndexes(model) {
  try {
    return await model.collection.indexes();
  } catch (error) {
    if (error?.codeName === "NamespaceNotFound") return [];
    throw error;
  }
}

function sameKey(a, b) {
  const ak = Object.keys(a || {});
  const bk = Object.keys(b || {});
  if (ak.length !== bk.length) return false;
  return ak.every((k) => a[k] === b[k]);
}

function findOldGlobalUniqueIndex(indexes, target) {
  return (
    indexes.find(
      (idx) =>
        idx?.unique === true &&
        (idx.name === target.oldIndex.name || sameKey(idx.key, target.oldIndex.key))
    ) || null
  );
}

function findCompoundUniqueIndex(indexes, target) {
  return indexes.find((idx) => idx?.unique === true && sameKey(idx.key, target.newIndex.key)) || null;
}

async function planForTarget(target) {
  const indexes = await getIndexes(target.model);
  const oldIdx = findOldGlobalUniqueIndex(indexes, target);
  const newIdx = findCompoundUniqueIndex(indexes, target);
  const actions = [];
  if (oldIdx) actions.push({ type: "drop", name: oldIdx.name, key: oldIdx.key });
  if (!newIdx) actions.push({ type: "create", name: target.newIndex.name, key: target.newIndex.key });
  return { key: target.key, indexes, oldIdx, newIdx, actions };
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
    const plans = [];
    for (const target of TARGETS) {
      plans.push({ target, ...(await planForTarget(target)) });
    }

    console.log("\nBefore indexes:");
    for (const plan of plans) {
      console.log(`  [${plan.key}]`);
      for (const idx of plan.indexes) {
        console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? " unique" : ""}`);
      }
    }

    const flatActions = plans.flatMap((p) => p.actions.map((a) => ({ collection: p.key, ...a })));
    if (flatActions.length === 0) {
      console.log("\nNo index changes needed.");
    } else {
      console.log(`\nPlanned actions (${dryRun ? "dry-run" : "real"}):`);
      for (const action of flatActions) {
        console.log(`  - ${action.collection}: ${action.type} ${action.name} ${JSON.stringify(action.key)}`);
      }
    }

    const results = [];
    if (!dryRun) {
      for (const plan of plans) {
        for (const action of plan.actions) {
          if (action.type === "drop") {
            await plan.target.model.collection.dropIndex(action.name);
            results.push({ collection: plan.key, ...action, status: "dropped" });
            console.log(`Dropped ${plan.key}.${action.name}`);
          } else if (action.type === "create") {
            await plan.target.model.collection.createIndex(action.key, { unique: true, name: action.name });
            results.push({ collection: plan.key, ...action, status: "created" });
            console.log(`Created ${plan.key}.${action.name}`);
          }
        }
      }
    }

    const after = [];
    for (const target of TARGETS) {
      const indexes = dryRun ? (plans.find((p) => p.key === target.key)?.indexes || []) : await getIndexes(target.model);
      after.push({ key: target.key, indexes });
    }

    console.log(`\n${dryRun ? "After (dry-run, unchanged):" : "After:"}`);
    for (const entry of after) {
      console.log(`  [${entry.key}]`);
      for (const idx of entry.indexes) {
        console.log(`    - ${idx.name}: ${JSON.stringify(idx.key)}${idx.unique ? " unique" : ""}`);
      }
    }

    return { dryRun, dbName, plans, results, after };
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
  getIndexes,
  findOldGlobalUniqueIndex,
  findCompoundUniqueIndex,
  sameKey,
  planForTarget,
  TARGETS,
};
