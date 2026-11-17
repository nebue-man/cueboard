import { sendBookingNotification } from "./whatsapp";

global.fetch = jest.fn();

afterEach(() => jest.clearAllMocks());

describe("sendBookingNotification", () => {
  it("calls the WhatsApp API with correct payload", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ messages: [{ id: "wamid.abc" }] }),
    });

    process.env.WHATSAPP_API_TOKEN = "test-token";
    process.env.WHATSAPP_PHONE_NUMBER_ID = "123456";

    await sendBookingNotification({
      toPhone:    "+94771234567",
      clubName:   "Break Point",
      guestName:  "Kamal",
      date:       "2030-01-15",
      startTime:  "14:00",
      tableNames: ["Table 1", "Table 2"],
    });

    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/messages"),
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("does not throw when API token is missing (dev mode)", async () => {
    const original = process.env.WHATSAPP_API_TOKEN;
    delete process.env.WHATSAPP_API_TOKEN;

    await expect(
      sendBookingNotification({
        toPhone: "+94771234567", clubName: "X", guestName: "Y",
        date: "2030-01-15", startTime: "10:00", tableNames: ["T1"],
      })
    ).resolves.not.toThrow();

    process.env.WHATSAPP_API_TOKEN = original;
  });
});
