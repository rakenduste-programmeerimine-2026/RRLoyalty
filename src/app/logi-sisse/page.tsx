import type { Metadata } from "next";
import Image from "next/image";
import { Suspense } from "react";
import { safeNextPath } from "@/lib/auth-redirect";
import { SignInForm } from "./SignInForm";
import "./sign-in.css";

export const metadata: Metadata = { title: "Logi sisse · Gustavi rada" };

type SearchParams = Promise<{ next?: string | string[]; valja?: string | string[] }>;

// searchParams is request data, so it is read inside the Suspense boundary
// and the rest of the page stays in the static shell.
async function Form({ searchParams }: { searchParams: SearchParams }) {
  const { next, valja } = await searchParams;
  return (
    <>
      <p className="muted small" role={valja ? "status" : undefined}>
        {valja
          ? "Logisid välja. Logi uuesti sisse, et näha oma Gustavi rada."
          : "Logi sisse, et näha oma punkte ja hüvesid Gustavi rajal."}
      </p>
      <SignInForm next={safeNextPath(Array.isArray(next) ? next[0] : next)} />
    </>
  );
}

export default function SignInPage({ searchParams }: { searchParams: SearchParams }) {
  return (
    <div className="sign-in">
      <main className="sign-in__card">
        <Image className="sign-in__logo" src="/assets/rr-logo.png" width={800} height={250} alt="Rahva Raamat" priority />
        <h1>Logi sisse</h1>
        <Suspense fallback={<SignInForm next="/konto" />}>
          <Form searchParams={searchParams} />
        </Suspense>
      </main>
    </div>
  );
}
