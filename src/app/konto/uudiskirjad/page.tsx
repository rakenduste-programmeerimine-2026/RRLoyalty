import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { AccountShell } from "@/components/AccountShell";
import { getMember } from "@/lib/auth";
import { NewsletterForm } from "./NewsletterForm";

export const metadata: Metadata = { title: "Uudiskirjad · Minu konto" };

const PATH = "/konto/uudiskirjad";

export default function NewslettersPage() {
  return (
    <AccountShell current="Uudiskirjad">
      <div>
        <h1>Uudiskirjad</h1>
        <p className="lede">Prototüübis e-kirju ei saadeta – teated jõuavad sinu Postkasti.</p>
      </div>
      <Suspense fallback={<p className="muted" role="status">Laen eelistusi…</p>}>
        <SignedInForm />
      </Suspense>
    </AccountShell>
  );
}

// The page is for members only, like the rest of the account.
async function SignedInForm() {
  await connection();
  await getMember(PATH);
  return <NewsletterForm />;
}
