const SIZE = 25;

const inFinder = (x: number, y: number) =>
  (x < 7 && y < 7) || (x >= SIZE - 7 && y < 7) || (x < 7 && y >= SIZE - 7);

const finderCell = (x: number, y: number) => {
  const cx = x < 7 ? x : x - (SIZE - 7);
  const cy = y < 7 ? y : y - (SIZE - 7);
  const ring = Math.max(Math.abs(cx - 3), Math.abs(cy - 3));
  return ring !== 2;
};

/** Decorative stand-in: this does not scan. Use a real QR library for gift cards. */
export function SampleQr({ seed }: { seed: string }) {
  const hash = [...seed].reduce((sum, char) => (sum * 31 + char.charCodeAt(0)) % 9973, 7);
  const cells = Array.from({ length: SIZE * SIZE }, (_, index) => {
    const x = index % SIZE;
    const y = Math.floor(index / SIZE);
    const filled = inFinder(x, y) ? finderCell(x, y) : (x * 7 + y * 13 + x * y + hash) % 5 < 2;
    return filled ? <rect key={index} x={x} y={y} width="1" height="1" /> : null;
  });

  return (
    <svg className="qr" viewBox={`0 0 ${SIZE} ${SIZE}`} fill="#231e33" role="img" aria-label="QR-kood">
      {cells}
    </svg>
  );
}
