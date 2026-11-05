export type Stop = { at: number; label: string };
export type StopState = "open" | "next" | "locked";

export const RAIL_END = 400;

export const STOPS: Stop[] = [
  { at: 50, label: "Tasuta kuum jook" },
  { at: 100, label: "5 € kinkekaart või annetus" },
  { at: 150, label: "Äpp 5 € (uutele)" },
  { at: 200, label: "5 € kinkekaart või annetus" },
  { at: 250, label: "Topelt-punktid" },
  { at: 300, label: "5 € kinkekaart või annetus" },
  { at: 350, label: "Tasuta pakiautomaat 15 €+" },
  { at: 400, label: "5 € kinkekaart või annetus" },
];

export function nextStop(points: number, stops: Stop[] = STOPS): Stop | undefined {
  return stops.find((stop) => stop.at > points);
}

export function stopState(stop: Stop, points: number, stops: Stop[] = STOPS): StopState {
  if (stop.at <= points) return "open";
  return stop === nextStop(points, stops) ? "next" : "locked";
}

export function pointsToNext(points: number, stops: Stop[] = STOPS): number {
  const next = nextStop(points, stops);
  return next ? next.at - points : 0;
}

/** Gustav's place on the rail as a percentage, clamped so he never leaves it. */
export function railPosition(points: number): number {
  return (Math.min(Math.max(points, 0), RAIL_END) / RAIL_END) * 100;
}
