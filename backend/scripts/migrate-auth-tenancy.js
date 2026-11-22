const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

const mongoose = require("mongoose");
const Business = require("../src/models/Business");
const User = require("../src/models/User");
const Product = require("../src/models/Product");
const Supplier = require("../src/models/Supplier");
const Customer = require("../src/models/Customer");
const Purchase = require("../src/models/Purchase");
const SaleOrder = require("../src/models/SaleOrder");
const StockMovement = require("../src/models/StockMovement");

const TARGETS = [
  { key: "products", model: Product },
  { key: "suppliers", model: Supplier },
  { key: "customers", model: Customer },
  { key: "purchases", model: Purchase },
  { key: "saleorders", model: SaleOrder },
  { key: "stockmovements", model: StockMovement },
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

function missingBusinessIdFilter() {
  return { $or: [{ businessId: null }, { businessId: { $exists: false } }] };
}

async function resolveOwnerAndBusiness({ businessId } = {}) {
  if (businessId) {
    if (!mongoose.Types.ObjectId.isValid(String(businessId))) {
      throw new Error(`--business-id is not a valid ObjectId: ${businessId}`);
    }
    const business = await Business.findById(businessId);
    if (!business) {
      throw new Error(`No business found for --business-id ${businessId}`);
    }
    const owner = await User.findOne({ businessId: business._id, role: "owner" });
    if (!owner) {
      throw new Error(
        `Business ${business._id} (${business.name}) has no owner. Refusing to migrate without a clear owner.`
      );
    }
    return { owner, business };
  }

  const owners = await User.find({ role: "owner" }).sort({ createdAt: 1, _id: 1 });
  if (owners.length === 0) {
    throw new Error(
      "No owner user found. Create/identify an owner before running migrate:auth-tenancy."
    );
  }
  if (owners.length > 1) {
    const ids = owners.map((o) => `${o.email}:${o._id}`).join(", ");
    throw new Error(
      `More than one owner exists (${ids}). Pass --business-id <id> to select the target business explicitly.`
    );
  }

  const owner = owners[0];
  if (!owner.businessId) {
    throw new Error(
      `Owner ${owner.email} (${owner._id}) has no businessId. Fix owner record before migration.`
    );
  }
  const business = await Business.findById(owner.businessId);
  if (!business) {
    throw new Error(
      `Owner ${owner.email} references missing businessId ${owner.businessId}.`
    );
  }
  return { owner, business };
}

async function collectCounts() {
  const counts = {};
  for (const target of TARGETS) {
    const total = await target.model.countDocuments({});
    const missing = await target.model.countDocuments(missingBusinessIdFilter());
    counts[target.key] = {
      total,
      missingBusinessId: missing,
      withBusinessId: total - missing,
    };
  }

  const totalUsers = await User.countDocuments({});
  const staffUsers = await User.countDocuments({ role: "staff" });
  const owners = await User.countDocuments({ role: "owner" });
  const admins = await User.countDocuments({ role: "admin" });
  counts.users = {
    total: totalUsers,
    staff: staffUsers,
    owners,
    admins,
  };
  return counts;
}

function printCounts(label, counts) {
  console.log(`\n${label}`);
  for (const target of TARGETS) {
    const c = counts[target.key];
    console.log(
      `  - ${target.key}: total=${c.total}, withBusinessId=${c.withBusinessId}, missingBusinessId=${c.missingBusinessId}`
    );
  }
  const u = counts.users;
  console.log(
    `  - users: total=${u.total}, owners=${u.owners}, admins=${u.admins}, staff=${u.staff}`
  );
}

async function applyBackfill({ businessId, ownerId, dryRun }) {
  const results = {};

  for (const target of TARGETS) {
    const filter = missingBusinessIdFilter();
    const missing = await target.model.countDocuments(filter);
    if (dryRun || missing === 0) {
      results[target.key] = { matched: missing, modified: 0 };
      continue;
    }
    const update = await target.model.updateMany(filter, {
      $set: { businessId },
    });
    // createdByUserId is audit-only and left null for legacy backfill unless we can prove it.
    results[target.key] = {
      matched: update.matchedCount ?? update.n ?? 0,
      modified: update.modifiedCount ?? update.nModified ?? 0,
    };
  }

  // Legacy role mapping. Never touch the owner record.
  const staffFilter = { role: "staff", _id: { $ne: ownerId } };
  const staffMatched = await User.countDocuments(staffFilter);
  if (dryRun || staffMatched === 0) {
    results.users = { staffMatched, staffModified: 0 };
  } else {
    const staffUpdate = await User.updateMany(staffFilter, { $set: { role: "user" } });
    results.users = {
      staffMatched,
      staffModified: staffUpdate.modifiedCount ?? staffUpdate.nModified ?? 0,
    };
  }

  return results;
}

async function runMigration(options = {}) {
  const dryRun = options.dryRun === true || options["dry-run"] === true;
  const confirm = options.confirm === true || options.confirm === "true";
  const businessId = options.businessId || options["business-id"] || null;
  const uri = options.uri || process.env.MONGODB_URI;

  if (!uri) {
    throw new Error("MONGODB_URI is required to run migrate:auth-tenancy.");
  }

  const dbName = databaseNameFromUri(uri);
  console.log(`Target database: ${dbName || "<unknown>"} (${uri.replace(/\/\/([^@]+)@/, "//<redacted>@")})`);

  if (!dryRun && !confirm) {
    throw new Error(
      "Refusing to run a real migration without --confirm. Use --dry-run to preview changes."
    );
  }

  const shouldConnect = mongoose.connection.readyState === 0;
  if (shouldConnect) {
    await mongoose.connect(uri);
  }

  try {
    const { owner, business } = await resolveOwnerAndBusiness({ businessId });
    console.log(`Owner: ${owner.email} (${owner._id})`);
    console.log(`Business: ${business.name} (${business._id})`);
    console.log(`Mode: ${dryRun ? "DRY RUN (no writes)" : "REAL RUN (--confirm)"}`);

    const before = await collectCounts();
    printCounts("Before:", before);

    const changes = await applyBackfill({
      businessId: business._id,
      ownerId: owner._id,
      dryRun,
    });

    const after = dryRun ? before : await collectCounts();
    printCounts(dryRun ? "After (dry-run, unchanged):" : "After:", after);

    console.log("\nChanges:");
    for (const target of TARGETS) {
      const c = changes[target.key];
      console.log(`  - ${target.key}: matched=${c.matched}, modified=${c.modified}`);
    }
    console.log(
      `  - users.staff->user: matched=${changes.users.staffMatched}, modified=${changes.users.staffModified}`
    );

    return {
      dryRun,
      dbName,
      owner: { id: String(owner._id), email: owner.email },
      business: { id: String(business._id), name: business.name },
      before,
      after,
      changes,
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
    businessId: options["business-id"] || options.businessId,
    uri: options.uri || process.env.MONGODB_URI,
  });
}

if (require.main === module) {
  main().catch((error) => {
    console.error(`migrate:auth-tenancy failed: ${error.message}`);
    process.exit(1);
  });
}

module.exports = {
  runMigration,
  parseArgs,
  resolveOwnerAndBusiness,
  collectCounts,
  applyBackfill,
  databaseNameFromUri,
  missingBusinessIdFilter,
  TARGETS,
};
