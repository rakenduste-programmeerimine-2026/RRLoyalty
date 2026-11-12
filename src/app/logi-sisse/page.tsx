import type { Metadata } from "next";
import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { safeNextPath } from "@/lib/auth-redirect";
import { SignInForm } from "./SignInForm";

export const metadata: Metadata = { title: "Logi sisse · Gustavi rada" };

type SearchParams = Promise<{ next?: string | string[]; valja?: string | string[] }>;

// searchParams is request data, so it is read inside the Suspense boundary
// and the rest of the page stays in the static shell.
async function Form({ searchParams }: { searchParams: SearchParams }) {
  const { next, valja } = await searchParams;
  return (
    <>
      {valja && (
        <p className="note" role="status">Logisid välja. Logi uuesti sisse, et näha oma Gustavi rada.</p>
      )}
      <SignInForm next={safeNextPath(Array.isArray(next) ? next[0] : next)} />
    </>
  );
}

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <>
      <SiteHeader />
      <main className="sign-in">
        <h1>Logi sisse</h1>
        <p className="lede">Logi sisse, et näha oma punkte ja hüvesid Gustavi rajal.</p>
        <Suspense fallback={<SignInForm next="/konto" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </main>
    </>
  );
}
