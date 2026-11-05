/** Original artwork. His feet rest at y=146 in a 120×150 box. */
function GustavFigure() {
  return (
    <g>
      <path fill="#231e33" d="M62 134c22 7 42 3 48-10 3-7-7-12-10-6-5 9-20 9-38 5z" />
      <path fill="#231e33" d="M30 138c-6-28 0-60 30-60s36 32 30 60c-1 5-5 8-10 8H40c-5 0-9-3-10-8z" />
      <path
        fill="#231e33"
        d="M26 34 24 8c0-3 3-4 5-2l17 14c9-3 19-3 28 0L91 6c2-2 5-1 5 2l-2 26c4 7 5 15 2 23-5 14-20 21-36 21s-31-7-36-21c-3-8-2-16 2-23z"
      />
      <path fill="#dcd8e7" d="M30 15l1 13 8-6zM90 15l-1 13-8-6z" />
      <ellipse cx="45" cy="46" rx="6" ry="7" fill="#fdfaf9" />
      <ellipse cx="75" cy="46" rx="6" ry="7" fill="#fdfaf9" />
      <ellipse cx="46" cy="47" rx="2.6" ry="5" fill="#231e33" />
      <ellipse cx="76" cy="47" rx="2.6" ry="5" fill="#231e33" />
      <path fill="#d00e40" d="M56 57h8l-4 5z" />
      <path
        fill="none"
        stroke="#dcd8e7"
        strokeLinecap="round"
        strokeWidth="1.5"
        d="M30 54 14 51M30 60l-15 3M90 54l16-3M90 60l15 3"
      />
      <path fill="#d00e40" d="M36 78c15 7 33 7 48 0l3 7c-17 8-37 8-54 0z" />
      <path fill="#d00e40" d="M54 86h12v18l-6-4-6 4z" />
      <ellipse cx="46" cy="144" rx="11" ry="5" fill="#fdfaf9" />
      <ellipse cx="74" cy="144" rx="11" ry="5" fill="#fdfaf9" />
    </g>
  );
}

export function Gustav() {
  return (
    <svg viewBox="0 0 120 150" aria-hidden="true">
      <GustavFigure />
    </svg>
  );
}

type SceneProps = { variant: "nameday" | "milestone" | "books"; label: string };

const placeGustav = (x: number, y: number, scale: number) =>
  `translate(${x} ${y}) scale(${scale})`;

export function GustavScene({ variant, label }: SceneProps) {
  return (
    <svg className="scene" viewBox="0 0 440 230" role="img" aria-label={label}>
      {variant === "nameday" && <NameDayBackdrop />}
      {variant === "milestone" && <MilestoneBackdrop />}
      {variant === "books" && <BooksBackdrop />}
      <g transform={variant === "books" ? placeGustav(172, 23, 0.8) : placeGustav(160, 62, 0.95)}>
        <GustavFigure />
      </g>
    </svg>
  );
}

function NameDayBackdrop() {
  const flags = ["#d00e40", "#58becc", "#fdfaf9", "#006666", "#d00e40", "#58becc", "#fdfaf9"];
  return (
    <>
      <rect width="440" height="230" fill="#dcd8e7" />
      <rect y="204" width="440" height="26" fill="#d2e2f1" />
      <path d="M0 20Q220 80 440 20" fill="none" stroke="#231e33" strokeWidth="1.5" />
      {flags.map((color, index) => {
        const x = 40 + index * 60;
        const y = 20 + 60 * 2 * (x / 440) * (1 - x / 440);
        return <path key={x} fill={color} d={`M${x - 14} ${y}h28l-14 26z`} />;
      })}
      <rect x="312" y="164" width="84" height="40" rx="4" fill="#fdfaf9" />
      <rect x="312" y="176" width="84" height="8" fill="#d00e40" />
      <rect x="352" y="146" width="5" height="18" fill="#006666" />
      <path fill="#d00e40" d="M354.5 134c5 6 5 10 0 12-5-2-5-6 0-12z" />
    </>
  );
}

function MilestoneBackdrop() {
  return (
    <>
      <rect width="440" height="230" fill="#d2e2f1" />
      <path fill="#dcd8e7" d="M0 204h440v26H0z" />
      <path d="M0 196h440" stroke="#006666" strokeDasharray="10 10" strokeWidth="6" />
      <rect x="326" y="90" width="8" height="114" fill="#231e33" />
      <circle cx="330" cy="86" r="42" fill="#d00e40" />
      <text x="330" y="98" fill="#fdfaf9" fontSize="34" fontWeight="700" textAnchor="middle">100</text>
      <path fill="#58becc" d="M70 44l6 14 14 6-14 6-6 14-6-14-14-6 14-6z" />
      <path fill="#fdfaf9" d="M112 96l4 9 9 4-9 4-4 9-4-9-9-4 9-4z" />
    </>
  );
}

function BooksBackdrop() {
  const books = [
    { x: 118, width: 204, color: "#006666" },
    { x: 134, width: 176, color: "#d00e40" },
    { x: 124, width: 190, color: "#58becc" },
    { x: 142, width: 160, color: "#dcd8e7" },
  ];
  return (
    <>
      <rect width="440" height="230" fill="#f9f1f0" />
      <circle cx="74" cy="60" r="30" fill="#dcd8e7" />
      <circle cx="378" cy="96" r="18" fill="#d2e2f1" />
      {books.map((book, index) => (
        <rect key={book.color} x={book.x} y={206 - index * 22} width={book.width} height="20" rx="3" fill={book.color} />
      ))}
    </>
  );
}
