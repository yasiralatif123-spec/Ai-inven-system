const RefreshSession = require("../src/models/RefreshSession");
const sessionService = require("../src/services/session.service");
const tokenService = require("../src/services/token.service");
const { createBusiness, createUser } = require("./helpers/auth");
const {
  connectTestDB,
  clearTestDB,
  disconnectTestDB,
} = require("./helpers/test-db");

beforeAll(async () => {
  await connectTestDB();
});
afterEach(async () => {
  await clearTestDB();
});
afterAll(async () => {
  await disconnectTestDB();
});

function fakeRequest() {
  return { ip: "127.0.0.1", get: () => "jest-agent" };
}

describe("token.service", () => {
  test("durationToMs parses the supported suffixes", () => {
    expect(tokenService.durationToMs("15m", 0, "TEST")).toBe(900000);
    expect(tokenService.durationToMs("7d", 0, "TEST")).toBe(604800000);
    expect(tokenService.durationToMs("500ms", 0, "TEST")).toBe(500);
    expect(tokenService.durationToMs(undefined, 1234, "TEST")).toBe(1234);
    expect(() => tokenService.durationToMs("next week", 0, "TEST")).toThrow(
      /Invalid TEST/
    );
  });

  test("hashToken is deterministic and peppered", () => {
    const token = "example.token.value";
    expect(tokenService.hashToken(token)).toBe(tokenService.hashToken(token));
    expect(tokenService.hashToken(token)).not.toBe(token);
    expect(tokenService.hashToken(token)).toHaveLength(64);
  });
});

describe("session service", () => {
  test("createSession stores only a hash and issues signed tokens", async () => {
    const business = await createBusiness();
    const user = await createUser({ business });

    const tokens = await sessionService.createSession({
      user,
      req: fakeRequest(),
    });

    const refreshPayload = tokenService.verifyRefreshToken(tokens.refreshToken);
    expect(refreshPayload.sid).toBe(tokens.sid);
    expect(refreshPayload.sub).toBe(String(user._id));

    const accessPayload = tokenService.verifyAccessToken(tokens.accessToken);
    expect(accessPayload).toMatchObject({
      sub: String(user._id),
      businessId: String(business._id),
      role: "owner",
      sid: tokens.sid,
      ver: 0,
    });

    const stored = await RefreshSession.findOne({ sid: tokens.sid }).select(
      "+tokenHash"
    );
    expect(stored.userId.toString()).toBe(user._id.toString());
    expect(stored.businessId.toString()).toBe(business._id.toString());
    expect(stored.tokenHash).toBe(
      tokenService.hashToken(tokens.refreshToken)
    );
    expect(stored.tokenHash).not.toContain(tokens.refreshToken);
    expect(stored.userAgent).toBe("jest-agent");
  });

  test("rotateSession replaces the hash and blocks token reuse", async () => {
    const business = await createBusiness();
    const user = await createUser({ business });
    const original = await sessionService.createSession({
      user,
      req: fakeRequest(),
    });

    const rotated = await sessionService.rotateSession(
      original.refreshToken,
      user
    );
    expect(rotated).not.toBeNull();
    expect(rotated.refreshToken).not.toBe(original.refreshToken);
    expect(rotated.session.sid).toBe(original.sid);
    expect(tokenService.verifyAccessToken(rotated.accessToken).sid).toBe(
      original.sid
    );

    const stored = await RefreshSession.findOne({ sid: original.sid }).select(
      "+tokenHash"
    );
    expect(stored.tokenHash).toBe(tokenService.hashToken(rotated.refreshToken));

    await expect(
      sessionService.rotateSession(original.refreshToken, user)
    ).resolves.toBeNull();
  });

  test("revoke makes the session inactive for authentication", async () => {
    const business = await createBusiness();
    const user = await createUser({ business });
    const tokens = await sessionService.createSession({
      user,
      req: fakeRequest(),
    });

    await expect(
      sessionService.findActiveSessionBySid(tokens.sid)
    ).resolves.not.toBeNull();

    const revoked = await sessionService.revokeSessionByRefreshToken(
      tokens.refreshToken
    );
    expect(revoked).toBe(true);
    await expect(
      sessionService.findActiveSessionBySid(tokens.sid)
    ).resolves.toBeNull();
  });

  test("revokeAllSessionsForUser revokes every active session", async () => {
    const business = await createBusiness();
    const user = await createUser({ business });
    await sessionService.createSession({ user, req: fakeRequest() });
    await sessionService.createSession({ user, req: fakeRequest() });

    expect(await sessionService.revokeAllSessionsForUser(user._id)).toBe(2);
    expect(await RefreshSession.countDocuments({ revokedAt: null })).toBe(0);
  });
});
