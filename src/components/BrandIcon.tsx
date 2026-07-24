/**
 * Inline-SVG brand marks. Apple's own rule, enforced here: a brand mark
 * appears ONLY when the brand is the destination —
 *
 *   apple     App Store links, nowhere else
 *   google    Google Play links and share-position Google Maps links
 *   whatsapp  WhatsApp destinations (channels, chats) only
 *
 * Directions buttons are destination-agnostic UI and use the Lucide
 * Navigation icon — even though the link opens Apple Maps. Government/
 * rail/official links keep generic icons (external-link/globe); no
 * third-party logos beyond these three. The Apple mark is mono and takes
 * currentColor; the Google "G" and the WhatsApp bubble keep their fixed
 * brand colors (sanctioned brand-artwork hex, like flags/crest). Marks
 * are decorative — the adjacent label carries the meaning.
 */

type Brand = "apple" | "google" | "whatsapp";

export default function BrandIcon({
  brand,
  size = 18,
  className,
}: {
  brand: Brand;
  /** Rendered square, 16–20px. */
  size?: number;
  className?: string;
}) {
  if (brand === "apple") {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        fill="currentColor"
        aria-hidden="true"
        className={className}
      >
        <path d="M12.152 6.896c-.948 0-2.415-1.078-3.96-1.04-2.04.027-3.91 1.183-4.961 3.014-2.117 3.675-.546 9.103 1.519 12.09 1.013 1.454 2.208 3.09 3.792 3.039 1.52-.065 2.09-.987 3.935-.987 1.831 0 2.35.987 3.96.948 1.637-.026 2.676-1.48 3.676-2.948 1.156-1.688 1.636-3.325 1.662-3.415-.039-.013-3.182-1.221-3.22-4.857-.026-3.04 2.48-4.494 2.597-4.559-1.429-2.09-3.623-2.324-4.39-2.376-2-.156-3.675 1.09-4.61 1.09zM15.53 3.83c.843-1.012 1.4-2.427 1.245-3.83-1.207.052-2.662.805-3.532 1.818-.78.896-1.454 2.338-1.273 3.714 1.338.104 2.715-.688 3.56-1.701" />
      </svg>
    );
  }

  if (brand === "whatsapp") {
    // Official full-color mark, svgo-optimized (fixed brand hex, like the
    // Google G).
    return (
      <svg
        viewBox="0 0 48 48"
        width={size}
        height={size}
        aria-hidden="true"
        className={className}
      >
        <path
          fill="#fff"
          d="m4.868 43.303 2.694-9.835a18.94 18.94 0 0 1-2.535-9.489C5.032 13.514 13.548 5 24.014 5a18.87 18.87 0 0 1 13.43 5.566A18.87 18.87 0 0 1 43 23.994c-.004 10.465-8.522 18.98-18.986 18.98h-.008a19 19 0 0 1-9.073-2.311z"
        />
        <path
          fill="#fff"
          d="M4.868 43.803a.5.5 0 0 1-.482-.631l2.639-9.636a19.5 19.5 0 0 1-2.497-9.556C4.532 13.238 13.273 4.5 24.014 4.5a19.37 19.37 0 0 1 13.784 5.713A19.36 19.36 0 0 1 43.5 23.994c-.004 10.741-8.746 19.48-19.486 19.48a19.54 19.54 0 0 1-9.144-2.277l-9.875 2.589a.5.5 0 0 1-.127.017"
        />
        <path
          fill="#cfd8dc"
          d="M24.014 5a18.87 18.87 0 0 1 13.43 5.566A18.87 18.87 0 0 1 43 23.994c-.004 10.465-8.522 18.98-18.986 18.98h-.008a19 19 0 0 1-9.073-2.311l-10.065 2.64 2.694-9.835a18.94 18.94 0 0 1-2.535-9.489C5.032 13.514 13.548 5 24.014 5m0-1C12.998 4 4.032 12.962 4.027 23.979a20 20 0 0 0 2.461 9.622L3.903 43.04a.998.998 0 0 0 1.219 1.231l9.687-2.54a20 20 0 0 0 9.197 2.244c11.024 0 19.99-8.963 19.995-19.98A19.86 19.86 0 0 0 38.153 9.86 19.87 19.87 0 0 0 24.014 4"
        />
        <path
          fill="#40c351"
          d="M35.176 12.832a15.67 15.67 0 0 0-11.157-4.626c-8.704 0-15.783 7.076-15.787 15.774a15.74 15.74 0 0 0 2.413 8.396l.376.597-1.595 5.821 5.973-1.566.577.342a15.75 15.75 0 0 0 8.032 2.199h.006c8.698 0 15.777-7.077 15.78-15.776a15.68 15.68 0 0 0-4.618-11.161"
        />
        <path
          fill="#fff"
          fillRule="evenodd"
          clipRule="evenodd"
          d="M19.268 16.045c-.355-.79-.729-.806-1.068-.82-.277-.012-.593-.011-.909-.011s-.83.119-1.265.594-1.661 1.622-1.661 3.956 1.7 4.59 1.937 4.906 3.282 5.259 8.104 7.161c4.007 1.58 4.823 1.266 5.693 1.187s2.807-1.147 3.202-2.255.395-2.057.277-2.255c-.119-.198-.435-.316-.909-.554s-2.807-1.385-3.242-1.543-.751-.237-1.068.238c-.316.474-1.225 1.543-1.502 1.859s-.554.357-1.028.119-2.002-.738-3.815-2.354c-1.41-1.257-2.362-2.81-2.639-3.285-.277-.474-.03-.731.208-.968.213-.213.474-.554.712-.831.237-.277.316-.475.474-.791s.079-.594-.04-.831c-.117-.238-1.039-2.584-1.461-3.522"
        />
      </svg>
    );
  }

  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
    >
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.85z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15A10.96 10.96 0 0 0 12 1 11 11 0 0 0 2.18 7.07l3.66 2.84C6.7 7.31 9.14 5.38 12 5.38z"
      />
    </svg>
  );
}
