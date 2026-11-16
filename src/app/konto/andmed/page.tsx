import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { EmptyState, LoadError } from "@/components/EmptyState";
import { getMember } from "@/lib/auth";
import { getNow } from "@/lib/demo-now";
import { formatDayEt, todayInEstonia } from "@/lib/namesakes";
import { daysUntil, nextNameDay } from "@/lib/profile";
import { loadProfile, type Profile } from "@/lib/supabase-profile";
import { ProfileForm } from "./ProfileForm";
import "./profile.css";

export const metadata: Metadata = { title: "Minu andmed · Minu konto" };

const PATH = "/konto/andmed";

export default function ProfilePage() {
  return (
    <AccountShell current="Minu andmed">
      <h1>Minu andmed</h1>
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
    return <LoadError what="Andmeid" retry={PATH} />;
  }

  if (!profile) {
    return (
      <EmptyState title="Kliendiklubi profiil puudub">
        Sinu kontol pole veel kliendiklubi andmeid. Võta ühendust klienditoega.
      </EmptyState>
    );
  }

  const today = todayInEstonia(await getNow());
  const nameDay = nextNameDay(profile.nameDays, today);
  const inDays = nameDay ? daysUntil(nameDay, today) : null;
  const nameDayText = nameDay
    ? `${formatDayEt(nameDay).slice(0, 5)}${inDays === 0 ? " · täna!" : ` · ${inDays} päeva pärast`}`
    : "–";

  return (
    <ProfileForm
      firstName={profile.firstName}
      lastName={profile.lastName ?? ""}
      email={profile.email}
      phone={profile.phone ?? ""}
      birthday={profile.birthday ?? ""}
    >
      <p className="profile-facts">
        <span><b>Nimepäev:</b> {nameDayText}</span>
        <span><b>Klubiliige alates:</b> {profile.memberSince.slice(0, 4)}</span>
        <span className="muted">Sünni- ja nimepäeval saad kliendiklubis eripakkumise.</span>
      </p>
    </ProfileForm>
  );
}
