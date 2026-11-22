describe("email.service", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    delete process.env.RESEND_API_KEY;
    process.env.NODE_ENV = "test";
    process.env.EMAIL_LOG_PREVIEW = "false";
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  test("isConfigured is false for missing or placeholder keys", () => {
    process.env.RESEND_API_KEY = "";
    let svc = require("../src/services/email.service");
    expect(svc.isConfigured()).toBe(false);

    jest.resetModules();
    process.env.RESEND_API_KEY = "re_placeholder";
    svc = require("../src/services/email.service");
    expect(svc.isConfigured()).toBe(false);

    jest.resetModules();
    process.env.RESEND_API_KEY = "replace_with_real_key";
    svc = require("../src/services/email.service");
    expect(svc.isConfigured()).toBe(false);
  });

  test("sendEmail returns preview in non-production when not configured", async () => {
    const { sendEmail } = require("../src/services/email.service");
    const result = await sendEmail({
      to: "user@example.com",
      subject: "Hello",
      html: "<p>Hello</p>",
      text: "Hello",
    });
    expect(result).toEqual({ delivered: false, preview: true });
  });

  test("sendEmail throws in production when not configured", async () => {
    process.env.NODE_ENV = "production";
    const { sendEmail } = require("../src/services/email.service");
    await expect(
      sendEmail({ to: "u@example.com", subject: "S", html: "<p>x</p>", text: "x" })
    ).rejects.toThrow("RESEND_API_KEY is not configured");
  });

  test("sendEmail sends through Resend when configured", async () => {
    const sendMock = jest.fn().mockResolvedValue({ data: { id: "email_123" }, error: null });
    jest.doMock("resend", () => ({
      Resend: jest.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
    }));

    process.env.RESEND_API_KEY = "re_live_test_key_1234567890";
    process.env.EMAIL_FROM = "StockFlow <noreply@example.com>";
    const { sendEmail } = require("../src/services/email.service");

    const result = await sendEmail({
      to: "user@example.com",
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "TEXT",
    });

    expect(sendMock).toHaveBeenCalledWith({
      from: "StockFlow <noreply@example.com>",
      to: ["user@example.com"],
      subject: "Subject",
      html: "<p>HTML</p>",
      text: "TEXT",
    });
    expect(result).toEqual({ delivered: true, id: "email_123" });
  });

  test("sendEmail surfaces Resend errors", async () => {
    const sendMock = jest
      .fn()
      .mockResolvedValue({ data: null, error: { message: "Bad sender" } });
    jest.doMock("resend", () => ({
      Resend: jest.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
    }));

    process.env.RESEND_API_KEY = "re_live_test_key_1234567890";
    const { sendEmail } = require("../src/services/email.service");

    await expect(
      sendEmail({ to: "u@example.com", subject: "S", html: "<p>x</p>", text: "x" })
    ).rejects.toThrow("Resend rejected email: Bad sender");
  });
});
