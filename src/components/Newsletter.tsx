"use client";

import { useState } from "react";
import Reveal from "./Reveal";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!EMAIL_RE.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setEmail("");
  }

  return (
    <section className="bg-cream-dark py-20 sm:py-24">
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-10">
        <Reveal>
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
                Stay In The Loop
              </p>
              <h2 className="mt-3 max-w-md font-display text-4xl font-black uppercase leading-[0.95] tracking-tight sm:text-5xl">
                Get 10% off your first order
              </h2>
              <p className="mt-4 max-w-sm text-ink/60">
                Join the list for early access to drops, restocks, and
                SABSTATION-only offers. No spam, unsubscribe anytime.
              </p>
            </div>

            <div>
              <form
                onSubmit={handleSubmit}
                noValidate
                className="flex flex-col gap-3 border-t-2 border-ink pt-6 sm:flex-row sm:items-stretch"
              >
                <label htmlFor="newsletter-email" className="sr-only">
                  Email address
                </label>
                <input
                  id="newsletter-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status !== "idle") setStatus("idle");
                  }}
                  placeholder="you@example.com"
                  aria-invalid={status === "error"}
                  aria-describedby="newsletter-message"
                  className="flex-1 border border-ink/20 bg-paper px-4 py-3.5 text-sm outline-none focus-visible:border-ink"
                />
                <button
                  type="submit"
                  className="shrink-0 rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
                >
                  Subscribe
                </button>
              </form>
              <p id="newsletter-message" className="mt-3 min-h-[1.25rem] text-sm" aria-live="polite">
                {status === "error" && (
                  <span className="text-orange">Please enter a valid email address.</span>
                )}
                {status === "success" && (
                  <span className="text-ink/70">You&apos;re on the list. Welcome to SABSTATION.</span>
                )}
              </p>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
