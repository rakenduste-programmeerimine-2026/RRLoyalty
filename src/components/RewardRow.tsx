import type { ReactNode } from "react";
import { Icon } from "./Icon";
import "./RewardRow.css";

type RewardRowProps = {
  title: string;
  detail: ReactNode;
  /** The button or link at the end of the row. */
  action?: ReactNode;
  /** A heavier border, for the row the page is about. */
  strong?: boolean;
  /** Greyed out: a used or expired card. */
  past?: boolean;
};

/** One perk, gift card or donation: an icon, two lines of text and an action. */
export function RewardRow({ title, detail, action, strong, past }: RewardRowProps) {
  const className = ["reward-row", strong && "reward-row--strong", past && "reward-row--past"].filter(Boolean).join(" ");
  return (
    <div className={className}>
      <Icon name="gift" size={20} />
      <span className="reward-row__text">
        <b>{title}</b>
        <span>{detail}</span>
      </span>
      {action}
    </div>
  );
}
