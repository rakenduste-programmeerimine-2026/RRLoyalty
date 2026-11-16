import Image from "next/image";
import "./Gustav.css";

/** The client's Gustav artwork (public/assets), cropped to the cat. */
const POSES = {
  /** Reading a book: his marker on the rail. */
  reading: { src: "/assets/gustav-reading.png", width: 143, height: 170 },
  /** Batting at something: the name-day and birthday messages. */
  playing: { src: "/assets/gustav-playing.png", width: 227, height: 136 },
  /** Sitting with a paw raised: a prize to choose. */
  reaching: { src: "/assets/gustav-reaching.png", width: 173, height: 158 },
  /** Asleep on a stack of books: the donation and the club card. */
  sleeping: { src: "/assets/gustav-sleeping.png", width: 700, height: 601 },
  /** Peeking from behind an edge: empty lists. */
  peeking: { src: "/assets/gustav-peeking.png", width: 68, height: 136 },
} as const;

export type GustavPose = keyof typeof POSES;

type GustavProps = {
  pose: GustavPose;
  /** Leave empty when Gustav is decoration. */
  alt?: string;
  className?: string;
};

export function Gustav({ pose, alt = "", className }: GustavProps) {
  const { src, width, height } = POSES[pose];
  return (
    <Image
      className={className ? `gustav ${className}` : "gustav"}
      src={src}
      width={width}
      height={height}
      alt={alt}
    />
  );
}

/** Gustav on a tinted panel, at the top of a message or a thank-you screen. */
export function GustavScene({ pose, label }: { pose: GustavPose; label: string }) {
  return (
    <div className="scene">
      <Gustav pose={pose} alt={label} />
    </div>
  );
}
