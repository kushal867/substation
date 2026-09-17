"use client";

import { useState } from "react";
import Reveal from "@/components/Reveal";

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const INITIAL: ContactForm = { name: "", email: "", subject: "", message: "" };

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(INITIAL);
  const [errors, setErrors] = useState<Partial<ContactForm>>({});
  const [sent, setSent] = useState(false);

  function update<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const next: Partial<ContactForm> = {};
    if (!form.name.trim()) next.name = "Required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    if (!form.subject.trim()) next.subject = "Required.";
    if (form.message.trim().length < 10) next.message = "Tell us a bit more (10+ characters).";
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    setSent(true);
    setForm(INITIAL);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 pb-24 pt-32 sm:px-6">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-orange">
          Get in Touch
        </p>
        <h1 className="mt-2 font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Contact Us
        </h1>
        <p className="mt-3 max-w-xl text-ink/60">
          Questions about sizing, materials, or an order? Send us a note and
          we&apos;ll get back to you within one business day.
        </p>
      </Reveal>

      <div className="mt-12 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_320px]">
        <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="name" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
                Name
              </label>
              <input
                id="name"
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                aria-invalid={Boolean(errors.name)}
                className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus-visible:border-ink ${
                  errors.name ? "border-orange" : "border-ink/20"
                }`}
              />
              {errors.name && <p className="mt-1 text-xs text-orange">{errors.name}</p>}
            </div>
            <div>
              <label htmlFor="email" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
                aria-invalid={Boolean(errors.email)}
                className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus-visible:border-ink ${
                  errors.email ? "border-orange" : "border-ink/20"
                }`}
              />
              {errors.email && <p className="mt-1 text-xs text-orange">{errors.email}</p>}
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Subject
            </label>
            <input
              id="subject"
              value={form.subject}
              onChange={(e) => update("subject", e.target.value)}
              aria-invalid={Boolean(errors.subject)}
              className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus-visible:border-ink ${
                errors.subject ? "border-orange" : "border-ink/20"
              }`}
            />
            {errors.subject && <p className="mt-1 text-xs text-orange">{errors.subject}</p>}
          </div>

          <div>
            <label htmlFor="message" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
              Message
            </label>
            <textarea
              id="message"
              rows={6}
              value={form.message}
              onChange={(e) => update("message", e.target.value)}
              aria-invalid={Boolean(errors.message)}
              className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus-visible:border-ink ${
                errors.message ? "border-orange" : "border-ink/20"
              }`}
            />
            {errors.message && <p className="mt-1 text-xs text-orange">{errors.message}</p>}
          </div>

          <button
            type="submit"
            className="self-start rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-ink"
          >
            Send Message
          </button>
          <p aria-live="polite" className="min-h-[1.25rem] text-sm text-ink/70">
            {sent && "Thanks — your message has been received."}
          </p>
        </form>

        <div className="flex flex-col gap-6 text-sm">
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Email</h3>
            <p className="mt-1">support@sabstation.com</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Phone</h3>
            <p className="mt-1">+1 (555) 019-2028</p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Studio</h3>
            <p className="mt-1">
              412 Foundry Street
              <br />
              Brooklyn, NY 11201
            </p>
          </div>
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-widest text-ink/50">Hours</h3>
            <p className="mt-1">Mon–Fri, 9am–6pm ET</p>
          </div>
        </div>
      </div>
    </div>
  );
}
