const DEFAULT_ACTOR_NAME = "System";

function cleanString(value) {
  return value === undefined || value === null ? "" : String(value).trim();
}

/**
 * Actor labels shown in the UI come from the authenticated user's name in the
 * User collection, never from caller-supplied strings. Auth middleware places
 * that value on req.auth.ownerName.
 */
function resolveActorName(req, fallback = DEFAULT_ACTOR_NAME) {
  const ownerName = cleanString(req?.auth?.ownerName) || cleanString(req?.user?.name);
  return ownerName || cleanString(fallback) || DEFAULT_ACTOR_NAME;
}

module.exports = { resolveActorName, DEFAULT_ACTOR_NAME };
