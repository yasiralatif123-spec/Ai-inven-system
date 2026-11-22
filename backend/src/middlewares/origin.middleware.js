const UNSAFE_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function allowedOrigins() {
  const configured = [
    process.env.CLIENT_URL,
    process.env.APP_URL,
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost",
    "http://127.0.0.1",
  ];
  const extras = (process.env.CLIENT_URLS || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  return new Set([...configured, ...extras].filter(Boolean));
}

function requestOrigin(req) {
  const origin = req.get("origin");
  if (origin) return origin;
  const referer = req.get("referer");
  if (!referer) return null;
  try {
    return new URL(referer).origin;
  } catch {
    return null;
  }
}

function checkOrigin(req, res, next) {
  if (!UNSAFE_METHODS.has(req.method)) return next();

  const origin = requestOrigin(req);
  // No Origin/Referer means a non-browser client (curl, Postman, monitors).
  // Browsers send Origin for unsafe methods, which is the CSRF-relevant case.
  if (!origin) return next();

  if (allowedOrigins().has(origin)) return next();

  return res.status(403).json({ message: "Request origin not allowed" });
}

module.exports = { checkOrigin, allowedOrigins, requestOrigin, UNSAFE_METHODS };
