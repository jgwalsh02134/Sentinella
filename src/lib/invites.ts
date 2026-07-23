/**
 * Invite-code configuration, read from INVITE_CODES on the server.
 *
 * Setting INVITE_CODES (comma-separated) limits registration to people who
 * have one of the codes. Leaving it unset or empty opens registration to
 * anyone — the register form then hides the invite field entirely. Codes are
 * compared trimmed and case-insensitively.
 */
export function inviteCodes(): string[] {
  return (process.env.INVITE_CODES ?? "")
    .split(",")
    .map((c) => c.trim().toUpperCase())
    .filter(Boolean);
}

export function invitesRequired(): boolean {
  return inviteCodes().length > 0;
}
