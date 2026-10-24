import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";

const hookSecret = Deno.env.get("SEND_SMS_HOOK_SECRET")?.replace("v1,whsec_", "");
const username = Deno.env.get("MELIPAYAMAK_USERNAME");
const password = Deno.env.get("MELIPAYAMAK_PASSWORD");
const sender = Deno.env.get("MELIPAYAMAK_SENDER");

Deno.serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  if (!hookSecret || !username || !password || !sender) {
    console.error("SMS hook is missing required server configuration");
    return new Response("SMS provider is not configured", { status: 500 });
  }

  let payload: {
    user?: { phone?: string };
    sms?: { otp?: string; message?: string };
  };

  try {
    const rawBody = await req.text();
    const headers = Object.fromEntries(req.headers.entries());
    const webhook = new Webhook(hookSecret);
    payload = webhook.verify(rawBody, headers) as typeof payload;
  } catch {
    return new Response("Invalid webhook signature", { status: 401 });
  }

  const phone = payload.user?.phone;
  const otp = payload.sms?.otp;

  if (!phone || !/^\+?\d{10,15}$/.test(phone) || !otp || !/^\d{4,8}$/.test(otp)) {
    return new Response("Invalid SMS payload", { status: 400 });
  }

  const message = `کد ورود یادآور چک: ${otp}`;
  const form = new URLSearchParams({
    username,
    password,
    to: phone.replace(/^\+98/, "0").replace(/^\+/, ""),
    from: sender,
    text: message,
    isFlash: "false",
  });

  try {
    const response = await fetch("https://rest.payamak-panel.com/api/SendSMS/SendSMS", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: form,
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      console.error("Melipayamak HTTP request failed", response.status);
      return new Response("SMS provider request failed", { status: 502 });
    }

    const result = await response.json() as { RetStatus?: number; StrRetStatus?: string };
    if (result.RetStatus !== 1) {
      console.error("Melipayamak rejected SMS request", result.RetStatus, result.StrRetStatus);
      return new Response("SMS provider rejected request", { status: 502 });
    }

    return new Response(null, { status: 200 });
  } catch (error) {
    console.error("Melipayamak request failed", error instanceof Error ? error.name : "unknown");
    return new Response("SMS provider unavailable", { status: 502 });
  }
});
