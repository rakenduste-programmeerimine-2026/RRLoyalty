import { ScreenFrame, type ScreenProps } from "./ScreenFrame";
import { SiteHeader } from "./SiteHeader";

/** A shop, message or reward screen with the site header on top (a message has none). */
export function Screen(props: ScreenProps) {
  return <ScreenFrame {...props} header={props.variant === "mail" ? undefined : <SiteHeader />} />;
}
