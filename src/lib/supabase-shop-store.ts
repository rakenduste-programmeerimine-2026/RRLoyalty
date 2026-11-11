// ShopStore against Supabase, with the server's secret key. RLS has no
// policies yet (#6), so reads go through the admin client too.

import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { NameDay } from "./name-day";
import { loadShop, todayInEstonia, type CatalogBook, type Shop, type ShopStore } from "./namesakes";
import { createAdminClient } from "./supabase/admin";

type BookRow = {
  slug: string;
  title: string;
  price: number | string;
  cover: CatalogBook["cover"];
  format: CatalogBook["format"];
  authors: { first_name: string; last_name: string | null } | null;
};

export class SupabaseShopStore implements ShopStore {
  constructor(private readonly db: SupabaseClient) {}

  async memberFirstName(memberId: string): Promise<string | null> {
    const { data, error } = await this.db
      .from("members")
      .select("first_name")
      .eq("id", memberId)
      .maybeSingle<{ first_name: string }>();
    if (error) throw new Error(`Could not read the member: ${error.message}`);
    return data?.first_name ?? null;
  }

  async nameDays(firstName: string): Promise<NameDay[]> {
    const { data, error } = await this.db.from("name_days").select("name, month, day").eq("name", firstName);
    if (error) throw new Error(`Could not read name days: ${error.message}`);
    return data as NameDay[];
  }

  async books(): Promise<CatalogBook[]> {
    const { data, error } = await this.db
      .from("books")
      .select("slug, title, price, cover, format, authors(first_name, last_name)")
      .order("title")
      .returns<BookRow[]>();
    if (error) throw new Error(`Could not read books: ${error.message}`);
    return data.flatMap((row) => {
      if (!row.authors) return [];
      const { first_name, last_name } = row.authors;
      return [
        {
          slug: row.slug,
          title: row.title,
          author: [first_name, last_name].filter(Boolean).join(" "),
          authorFirstName: first_name,
          price: Number(row.price),
          cover: row.cover,
          format: row.format,
        },
      ];
    });
  }

  async lapPoints(memberId: string): Promise<number> {
    const { data, error } = await this.db
      .from("member_points")
      .select("current_lap_points")
      .eq("member_id", memberId)
      .maybeSingle<{ current_lap_points: number }>();
    if (error) throw new Error(`Could not read the member's points: ${error.message}`);
    return Number(data?.current_lap_points ?? 0);
  }
}

/** The shop for the signed-in member today. Server only: the caller must have checked memberId with getMember(). */
export function loadShopFromSupabase(memberId: string, today: string = todayInEstonia()): Promise<Shop> {
  return loadShop(new SupabaseShopStore(createAdminClient()), memberId, today);
}
