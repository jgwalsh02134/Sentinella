/**
 * The U.S. State Department's official WhatsApp channel — ONE config
 * object so the full card (/prepare) and the compact rows (/emergency,
 * /alerts) can never drift apart. Static typed data, bundled offline
 * like all safety content (the channel itself needs a connection).
 *
 * channelUrl verified against the State Department's own announcement;
 * appStoreUrl verified via the iTunes lookup API to resolve to
 * "WhatsApp Messenger" by WhatsApp Inc. (July 2026).
 */
export const stateDeptWhatsApp = {
  taskTitle: "Follow the State Dept WhatsApp channel",
  compactTitle: "Security updates on WhatsApp",
  summary: "Official security updates from the State Dept, pushed to WhatsApp.",
  channelUrl: "https://whatsapp.com/channel/0029Var8szHInlqREVL5jC0g",
  appStoreUrl: "https://apps.apple.com/app/whatsapp-messenger/id310633997",
  steps: [
    "Get WhatsApp if you don't have it.",
    "Open the channel and tap Follow.",
    "Tap the bell in the channel — channels are silent by default; the bell turns on notifications.",
  ],
  openLabel: "Open channel",
  appStoreLabel: "App Store",
  footnote: "One-way broadcast — it can't answer you. Needs a connection.",
} as const;
