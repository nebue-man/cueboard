type NotificationParams = {
  toPhone:    string;
  clubName:   string;
  guestName:  string;
  date:       string;
  startTime:  string;
  tableNames: string[];
};

export async function sendBookingNotification(params: NotificationParams): Promise<void> {
  const token   = process.env.WHATSAPP_API_TOKEN;
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneId) {
    console.log("[WhatsApp] Skipping — WHATSAPP_API_TOKEN or WHATSAPP_PHONE_NUMBER_ID not set");
    return;
  }

  const body = {
    messaging_product: "whatsapp",
    to: params.toPhone.replace(/\s+/g, ""),
    type: "text",
    text: {
      body:
        `New booking at ${params.clubName}\n\n` +
        `Guest: ${params.guestName}\n` +
        `Date: ${params.date} at ${params.startTime}\n` +
        `Tables: ${params.tableNames.join(", ")}`,
    },
  };

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneId}/messages`,
    {
      method:  "POST",
      headers: {
        Authorization:  `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    },
  );

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error("[WhatsApp] Send failed:", err);
  }
}
