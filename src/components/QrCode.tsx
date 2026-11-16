import "./QrCode.css";

/** A QR code drawn on the server (src/lib/qr.ts), with the code it holds as its name. */
export function QrCode({ svg, code, size = "large" }: { svg: string; code: string; size?: "large" | "small" }) {
  return (
    <div
      className={`qr qr--${size}`}
      role="img"
      aria-label={`QR-kood: ${code}`}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
