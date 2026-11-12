// What the "Annetused" page shows. Pure: rows are passed in.
// Rules: docs/program-rules.md (Perks: donations go to one school).

/** A donations row with the rail stop of its perk. */
export type DonationRow = {
  id: number;
  amount: number;
  school: string;
  createdAt: Date;
  stopAt: number | null;
};

export type DonationView = {
  id: number;
  amount: number;
  school: string;
  createdAt: Date;
  source: string;
};

export type DonationsView = {
  /** Every donation ever made, in euros. */
  total: number;
  /** Newest first. */
  items: DonationView[];
};

export function donationsView(rows: DonationRow[]): DonationsView {
  const totalCents = rows.reduce((sum, row) => sum + Math.round(row.amount * 100), 0);
  return {
    total: totalCents / 100,
    items: [...rows]
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
      .map((row) => ({
        id: row.id,
        amount: row.amount,
        school: row.school,
        createdAt: row.createdAt,
        source: row.stopAt ? `Gustavi rada ${row.stopAt} p` : "Gustavi rada",
      })),
  };
}

/** "Näidiskooli raamatukogu": the school's name is stored in the genitive, as in settings.donation_school. */
export function libraryName(school: string): string {
  return `${school} raamatukogu`;
}
