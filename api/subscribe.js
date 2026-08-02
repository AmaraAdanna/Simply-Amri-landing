/**
 * Simply Amri landing page → Beehiiv relay
 * Identical to the app's version — same publication, same allowed milestones.
 * Needs its own BEEHIIV_API_KEY and BEEHIIV_PUB_ID env vars in this Vercel project.
 */

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { email, milestone, name, lang } = req.body || {};

  if (!email || typeof email !== "string" || !email.includes("@")) {
    return res.status(400).json({ error: "Valid email required" });
  }
  if (!milestone || typeof milestone !== "string") {
    return res.status(400).json({ error: "Milestone required" });
  }

  const allowedMilestones = ["hba1c_started", "hba1c_improved", "streak_3", "signup"];
  if (!allowedMilestones.includes(milestone)) {
    return res.status(400).json({ error: "Unknown milestone" });
  }

  const { BEEHIIV_API_KEY, BEEHIIV_PUB_ID } = process.env;
  if (!BEEHIIV_API_KEY || !BEEHIIV_PUB_ID) {
    return res.status(500).json({ error: "Server not configured (missing env vars)" });
  }

  try {
    const beehiivRes = await fetch(
      `https://api.beehiiv.com/v2/publications/${BEEHIIV_PUB_ID}/subscriptions`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${BEEHIIV_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          reactivate_existing: true,
          send_welcome_email: false,
          custom_fields: [
            { name: "milestone", value: milestone },
            { name: "first_name", value: name || "" },
            { name: "app_lang", value: lang || "en" },
          ],
        }),
      }
    );

    if (!beehiivRes.ok) {
      const errText = await beehiivRes.text();
      return res.status(502).json({ error: "Beehiiv error", detail: errText });
    }

    return res.status(200).json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: "Relay failed", detail: String(err) });
  }
}
