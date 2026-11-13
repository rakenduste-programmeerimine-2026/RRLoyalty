import { beforeEach, describe, expect, it } from "vitest";
import { MemoryMessageStore } from "./memory-message-store";
import {
  BIRTHDAY_LINK,
  deliverMessages,
  dueMessages,
  messageScreen,
  NAME_DAY_LINK,
  pickMessage,
  PRIZE_LINK,
  PRIZE_STOPS,
  type MessageInput,
  type MessagePerk,
} from "./messages";

const MEMBER = "member-1";
const at = (day: string) => new Date(`${day}T10:00:00Z`);

const prize = (id: number, stopAt: number, day = "2026-11-10"): MessagePerk => ({
  id,
  source: "rail",
  stopAt,
  birthdayYear: null,
  openedAt: at(day),
});

const birthday = (id: number, year: number): MessagePerk => ({
  id,
  source: "birthday",
  stopAt: null,
  birthdayYear: year,
  openedAt: at(`${year}-03-14`),
});

const input = (overrides: Partial<MessageInput> = {}): MessageInput => ({
  firstName: "Mari",
  nameDays: [
    { name: "Mari", month: 11, day: 6 },
    { name: "Mari", month: 7, day: 22 },
  ],
  perks: [],
  today: "2026-11-12",
  ...overrides,
});

describe("dueMessages", () => {
  it("has a name-day message only on the name day itself", () => {
    expect(dueMessages(input({ today: "2026-11-05" }))).toEqual([]);
    expect(dueMessages(input({ today: "2026-11-07" }))).toEqual([]);

    const [message] = dueMessages(input({ today: "2026-11-06" }));
    expect(message).toMatchObject({
      kind: "name_day",
      title: "Palju õnne nimepäevaks, Mari!",
      link: NAME_DAY_LINK,
      eventKey: "name_day:2026-11-06",
    });
  });

  it("gives each name day of the year its own event", () => {
    expect(dueMessages(input({ today: "2026-07-22" }))[0].eventKey).toBe("name_day:2026-07-22");
    expect(dueMessages(input({ today: "2026-11-06" }))[0].eventKey).toBe("name_day:2026-11-06");
  });

  it("needs the exact first name for the name day", () => {
    expect(dueMessages(input({ firstName: "mari", today: "2026-11-06" }))).toEqual([]);
  });

  it("has a prize message for every prize stop, and none for the other stops", () => {
    expect(PRIZE_STOPS).toEqual([100, 200, 300, 400]);
    const perks = [50, 100, 150, 200, 250, 300, 350, 400].map((stop, i) => prize(i + 1, stop));

    const messages = dueMessages(input({ perks }));
    expect(messages.map((m) => m.title)).toEqual([
      "Sul on 100 punkti – vali oma tasu",
      "Sul on 200 punkti – vali oma tasu",
      "Sul on 300 punkti – vali oma tasu",
      "Sul on 400 punkti – vali oma tasu",
    ]);
    expect(messages.every((m) => m.kind === "points_100" && m.link === PRIZE_LINK)).toBe(true);
  });

  it("keys a prize message by its perk, so a stop reached again on a new lap or after expiry gets a new one", () => {
    const firstLap = prize(2, 100, "2026-01-10");
    const secondLap = prize(9, 100, "2026-06-01");
    expect(dueMessages(input({ perks: [firstLap, secondLap] })).map((m) => m.eventKey)).toEqual([
      "points_100:perk:2",
      "points_100:perk:9",
    ]);
  });

  it("has one birthday message per birthday card, dated when the card opened", () => {
    const [message] = dueMessages(input({ perks: [birthday(4, 2026)] }));
    expect(message).toMatchObject({
      kind: "birthday",
      title: "Palju õnne sünnipäevaks, Mari!",
      link: BIRTHDAY_LINK,
      eventKey: "birthday:2026",
      createdAt: at("2026-03-14"),
    });
  });
});

describe("deliverMessages", () => {
  let store: MemoryMessageStore;
  beforeEach(() => {
    store = new MemoryMessageStore();
  });

  it("creates one message per event, however often the event is delivered again", async () => {
    const event = input({ today: "2026-11-06", perks: [prize(1, 100), birthday(2, 2026)] });

    expect(await deliverMessages(store, MEMBER, event)).toBe(3);
    expect(await deliverMessages(store, MEMBER, event)).toBe(0);
    expect(await deliverMessages(store, MEMBER, event)).toBe(0);

    expect((await store.messages(MEMBER)).map((m) => m.kind).sort()).toEqual(["birthday", "name_day", "points_100"]);
  });

  it("adds only the new event when another one happens", async () => {
    await deliverMessages(store, MEMBER, input({ perks: [prize(1, 100)] }));
    expect(await deliverMessages(store, MEMBER, input({ perks: [prize(1, 100), prize(5, 200)] }))).toBe(1);
    expect(await store.messages(MEMBER)).toHaveLength(2);
  });

  it("keeps each member's messages apart", async () => {
    await deliverMessages(store, MEMBER, input({ perks: [prize(1, 100)] }));
    expect(await deliverMessages(store, "member-2", input({ perks: [prize(1, 100)] }))).toBe(1);
    expect(await store.messages("member-2")).toHaveLength(1);
  });

  it("lists the newest message first", async () => {
    await deliverMessages(store, MEMBER, input({ today: "2026-11-06", perks: [prize(1, 100, "2026-11-10")] }));
    expect((await store.messages(MEMBER)).map((m) => m.kind)).toEqual(["points_100", "name_day"]);
  });

  it("marks a message read once", async () => {
    await deliverMessages(store, MEMBER, input({ perks: [prize(1, 100)] }));
    const [message] = await store.messages(MEMBER);

    await store.markRead(MEMBER, message.id, at("2026-11-12"));
    await store.markRead(MEMBER, message.id, at("2026-11-13"));
    await store.markRead("member-2", message.id, at("2026-11-14"));

    expect((await store.messages(MEMBER))[0].readAt).toEqual(at("2026-11-12"));
  });
});

describe("message links", () => {
  it("opens each kind in its own Postkast screen", () => {
    expect(messageScreen({ id: 7, kind: "name_day" })).toBe("/postkast/nimepaev?id=7");
    expect(messageScreen({ id: 8, kind: "points_100" })).toBe("/postkast/100-punkti?id=8");
    expect(messageScreen({ id: 9, kind: "birthday" })).toBe("/postkast/sunnipaev?id=9");
  });

  it("sends each screen's button into the right flow", () => {
    const [nameDay, prizeChoice, card] = dueMessages(
      input({ today: "2026-11-06", perks: [prize(1, 100), birthday(2, 2026)] }),
    );
    expect(nameDay.link).toBe("/nimekaimud");
    expect(prizeChoice.link).toBe("/konto/gustavi-rada/tasu");
    expect(card.link).toBe("/konto/gustavi-rada");
  });

  it("picks the message in ?id= only when it is that screen's kind", async () => {
    const store = new MemoryMessageStore();
    await deliverMessages(store, MEMBER, input({ today: "2026-11-06", perks: [prize(1, 100), prize(2, 200)] }));
    const messages = await store.messages(MEMBER);
    const nameDay = messages.find((m) => m.kind === "name_day")!;
    const stop100 = messages.find((m) => m.title.includes("100"))!;

    expect(pickMessage(messages, "points_100", String(stop100.id))).toBe(stop100);
    expect(pickMessage(messages, "points_100", String(nameDay.id))).toBeNull();
    expect(pickMessage(messages, "points_100", "999")).toBeNull();
    // Without an id: the newest of that kind (same time, so the later row).
    expect(pickMessage(messages, "points_100", undefined)?.title).toBe("Sul on 200 punkti – vali oma tasu");
    expect(pickMessage(messages, "birthday", undefined)).toBeNull();
  });
});
