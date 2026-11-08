import QRCode from "qrcode";

/** A scannable QR code as SVG markup, drawn on the server. */
export function qrSvg(text: string): Promise<string> {
  return QRCode.toString(text, {
    type: "svg",
    errorCorrectionLevel: "M",
    margin: 0,
    color: { dark: "#231e33", light: "#ffffff" },
  });
}
