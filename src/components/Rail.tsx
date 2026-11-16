import type { CSSProperties } from "react";
import { Gustav } from "@/components/Gustav";
import { STOPS, nextStop, pointsToNext, railPosition, stopState, type Stop } from "@/lib/rail";
import "./Rail.css";

const STOP_STYLE = { open: "stop--open", next: "stop--next", locked: "" };

/** A place on the rail from 0 to 1, for the CSS in Rail.css. */
const fraction = (points: number) => railPosition(points) / 100;

function RailStop({ stop, points }: { stop: Stop; points: number }) {
  const state = stopState(stop, points);
  const left = `veel ${stop.at - points} p`;
  return (
    <li className={`stop ${STOP_STYLE[state]}`} style={{ "--at": fraction(stop.at) } as CSSProperties}>
      <span className="stop__dot">{stop.at}</span>
      <span className="stop__text">
        <span className="stop__label">{stop.label}</span>
        {state === "open" && <span className="stop__state">✓ Avatud</span>}
        {state === "next" && (
          <span className="stop__state">
            <span className="stop__state-wide">{left}</span>
            <span className="stop__state-phone">Järgmine peatus</span>
          </span>
        )}
      </span>
      {state === "next" && <span className="stop__left" aria-hidden="true">{left}</span>}
    </li>
  );
}

/** "Sinu rada": Gustav on the rail. It runs left to right on a wide screen and top to bottom on a phone. */
export function Rail({ points }: { points: number }) {
  const next = nextStop(points);
  return (
    <section className="rail-card" aria-labelledby="rail-title">
      <div className="rail-card__head">
        <h2 id="rail-title">Sinu rada</h2>
        <span>
          <b>{points} p</b>
          {next && ` · veel ${pointsToNext(points)} p peatuseni ${next.at}`}
        </span>
      </div>
      <div className="rail-scroll" tabIndex={0} role="group" aria-label={`Gustavi rada: ${points} punkti`}>
        <div className="rail" style={{ "--pos": fraction(points) } as CSSProperties}>
          <div className="rail__line" />
          <div className="rail__fill" />
          <span className="rail__start" />
          <span className="rail__start-label">Start</span>
          <div className="rail__marker">
            <span className="rail__points">{points} p</span>
            <Gustav pose="reading" alt="Gustav loeb – sinu koht rajal" />
            <span className="rail__pointer" aria-hidden="true" />
          </div>
          <ol className="rail__stops">
            {STOPS.map((stop) => (
              <RailStop key={stop.at} stop={stop} points={points} />
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
