import type { CSSProperties } from "react";
import { Gustav } from "@/components/Gustav";
import { STOPS, nextStop, pointsToNext, railPosition, stopState, type Stop } from "@/lib/rail";

const STOP_STYLE = { open: "stop--open", next: "stop--next", locked: "" };

function RailStop({ stop, points }: { stop: Stop; points: number }) {
  const state = stopState(stop, points);
  return (
    <li className={`stop ${STOP_STYLE[state]}`} style={{ "--at": `${railPosition(stop.at)}%` } as CSSProperties}>
      <span className="stop__dot">{stop.at}</span>
      <span className="stop__label">{stop.label}</span>
      {state === "open" && <span className="stop__state">✓ Avatud</span>}
      {state === "next" && <span className="stop__state">veel {stop.at - points} p</span>}
    </li>
  );
}

export function Rail({ points }: { points: number }) {
  return (
    <section className="rail-card">
      <div className="rail-scroll" tabIndex={0} role="group" aria-label={`Gustavi rada: ${points} punkti`}>
        <div className="rail" style={{ "--pos": `${railPosition(points)}%` } as CSSProperties}>
          <div className="rail__track">
            <div className="rail__fill" />
            <span className="rail__start" />
            <span className="rail__start-label">Start</span>
            <div className="gustav">
              <Gustav />
            </div>
            {nextStop(points) && (
              <div className="bubble">Veel {pointsToNext(points)} p järgmise peatuseni</div>
            )}
            <ol>
              {STOPS.map((stop) => (
                <RailStop key={stop.at} stop={stop} points={points} />
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
