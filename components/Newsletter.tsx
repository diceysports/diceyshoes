"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.includes("@")) return;
    // POC only — there is no newsletter table in the current schema.
    // Wire this to a real signup provider or a new `shoe_newsletter_signups`
    // table (via a proper migration) before relying on it.
    setSubmitted(true);
    setEmail("");
  }

  return (
    <section className="bg-chrome py-20 text-center text-white">
      <div className="mx-auto max-w-xl px-5">
        <h2 className="font-display mb-4 text-[clamp(32px,5vw,52px)] uppercase leading-none">
          Don&apos;t Miss
          <br />
          The Next Drop.
        </h2>
        <p className="mb-7 text-sm text-chrome-fog">
          New releases, restocks and sneaker news — straight to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="mx-auto flex max-w-md">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            className="w-full border border-chrome-line bg-transparent px-4 py-3.5 text-sm text-white outline-none placeholder:text-chrome-fog focus:border-white/40"
          />
          <button
            type="submit"
            className="whitespace-nowrap bg-volt px-6 py-3.5 text-xs font-bold uppercase tracking-wide text-chrome transition-transform hover:scale-[1.03]"
          >
            Join The List
          </button>
        </form>
        {submitted && (
          <p className="mt-3.5 text-sm font-semibold text-volt">
            You&apos;re on the list. Watch for the next drop.
          </p>
        )}
      </div>
    </section>
  );
}
