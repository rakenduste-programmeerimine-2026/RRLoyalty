import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { getMember } from "@/lib/auth";
import { formatDayEt, todayInEstonia } from "@/lib/namesakes";
import { daysUntil, nextNameDay } from "@/lib/profile";
import { loadProfile, type Profile } from "@/lib/supabase-profile";
import { ProfileForm } from "./ProfileForm";

export const metadata: Metadata = { title: "Minu andmed · Minu konto" };

const PATH = "/konto/andmed";

export default function ProfilePage() {
  return (
    <AccountShell current="Minu andmed">
      <div>
        <h1>Minu andmed</h1>
        <p className="lede">Sünni- ja nimepäeval saad kliendiklubis eripakkumise.</p>
      </div>
      <Suspense fallback={<p className="muted" role="status">Laen andmeid…</p>}>
        <ProfileContent />
      </Suspense>
    </AccountShell>
  );
}

async function ProfileContent() {
  await connection();
  await getMember(PATH);

  let profile: Profile | null;
  try {
    profile = await loadProfile();
  } catch (error) {
    console.error("Could not load the profile page", error);
    return (
      <section className="perk" role="alert">
        <h2>Midagi läks valesti</h2>
        <p>Andmeid ei õnnestunud laadida. Proovi hetke pärast uuesti.</p>
        <div className="perk__actions">
          <Link className="btn btn--auto" href={PATH}>Proovi uuesti</Link>
        </div>
      </section>
    );
  }

  if (!profile) {
    return (
      <section className="perk">
        <h2>Kliendiklubi profiil puudub</h2>
        <p>Sinu kontol pole veel kliendiklubi andmeid. Võta ühendust klienditoega.</p>
      </section>
    );
  }

  const today = todayInEstonia();
  const nameDay = nextNameDay(profile.nameDays, today);
  const inDays = nameDay ? daysUntil(nameDay, today) : null;

  return (
    <div className="profile">
      <dl className="profile__facts">
        <div>
          <dt>Nimepäev</dt>
          <dd>
            {nameDay
              ? `${formatDayEt(nameDay).slice(0, 5)}${inDays === 0 ? " · täna!" : ` · ${inDays} päeva pärast`}`
              : "–"}
          </dd>
        </div>
        <div>
          <dt>Klubiliige alates</dt>
          <dd>{profile.memberSince.slice(0, 4)}</dd>
        </div>
      </dl>
      <ProfileForm
        firstName={profile.firstName}
        lastName={profile.lastName ?? ""}
        email={profile.email}
        phone={profile.phone ?? ""}
        birthday={profile.birthday ?? ""}
      />
    </div>
  );
}
