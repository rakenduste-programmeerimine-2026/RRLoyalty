# Gustavi rada program rules

The agreed rules for the prototype. When the code or an issue disagrees with this file, this file wins. Change it through a PR.

## Points

- A member earns 1 point per euro paid, rounded down per purchase. €18.99 earns 18.
- Points are earned on the amount paid after discounts.
- Points are lifetime progress on the current lap: redeeming a perk never reduces them.
- Points expire 6 months after the member's last purchase, and each purchase restarts the 6 months.
- Expiry sets the current lap to 0 and returns Gustav to Start.

## The rail and laps

| Stop | Reward | Type |
| --- | --- | --- |
| 50 | Tasuta kuum jook, or a week free in the app | Direct perk |
| 100 | 5 € kinkekaart või annetus | Prize choice |
| 150 | Äpp 5 € (uutele) | Code only, once per member |
| 200 | 5 € kinkekaart või annetus | Prize choice |
| 250 | Topelt-punktid | Direct perk |
| 300 | 5 € kinkekaart või annetus | Prize choice |
| 350 | Tasuta pakiautomaat 15 €+ | Direct perk |
| 400 | 5 € kinkekaart või annetus | Prize choice |

- If a purchase passes several stops, every stop passed opens its perk.
- Reaching 400 opens that stop's prize and starts the next lap. Extra points carry over: 390 + 25 gives 15.
- Laps repeat the same stops and earn the perks again, except the one-time 150 stop.
- Perks, gift cards, completed laps and the lifetime total survive a lap reset and point expiry.

## Perks

- Perks last 60 days.
- Prize choice: the member has 3 days to choose a 5 € gift card or a donation. With no choice, they get the gift card automatically.
- Gift cards are shown with a QR code, and the wireframe condition is a purchase from 20 €.
- Donations go to one school, stored as a setting.
- App perks and the birthday card are shown as a code only. Nothing happens in a real app.
- The demo-only "Märgi kasutatuks" button spends a perk. There is no till or staff scanner.
- Gift cards cannot be applied in our cart.

## Name day and birthday

- Name day: 10% off books by namesake authors for 7 days from the name day. The author's first name must match exactly.
- Name days come from a small table of the seeded names.
- Birthday: a 5 € reward card, code only, once a year.

## Simulated for the prototype

- Every sales channel. Keep the channel on each purchase so a real feed could replace the simulation.
- Payment. Checkout has no payment provider.
- Emails. Messages appear in the in-app Postkast, and no email is sent.
- `/demo`, hidden from navigation, adds purchases from any channel, triggers name days and birthdays, and skips ahead 3 days or 6 months.

## Demo

- Sign-in is email and password through a hosted Supabase project, with a seeded demo account.
- The demo member starts on 34 points, so the name-day purchase of €18 takes them to 52.
- The Supabase free plan pauses after about a week without activity, so open the project before presenting.

## Open with the client

- What "Äpp 5 € (uutele)" and "nädal tasuta äpis" actually give the member.
- How long "Topelt-punktid" lasts once it opens.
- The official logo and any existing Gustav artwork.
