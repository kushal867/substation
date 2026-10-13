"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/context/CartContext";
import { formatPrice } from "@/lib/format";
import Reveal from "@/components/Reveal";

interface FormState {
  email: string;
  firstName: string;
  lastName: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  paymentMethod: "card" | "paypal";
  cardNumber: string;
  expiry: string;
  cvc: string;
}

const INITIAL_FORM: FormState = {
  email: "",
  firstName: "",
  lastName: "",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "United States",
  paymentMethod: "card",
  cardNumber: "",
  expiry: "",
  cvc: "",
};

type Errors = Partial<Record<keyof FormState, string>>;

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCart();
  const [form, setForm] = useState<FormState>(INITIAL_FORM);
  const [errors, setErrors] = useState<Errors>({});
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");

  const shipping = subtotal > 150 || subtotal === 0 ? 0 : 12;
  const total = subtotal + shipping;

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    if (errors[key]) setErrors((e) => ({ ...e, [key]: undefined }));
  }

  function validate(): boolean {
    const next: Errors = {};
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email.";
    if (!form.firstName.trim()) next.firstName = "Required.";
    if (!form.lastName.trim()) next.lastName = "Required.";
    if (!form.address.trim()) next.address = "Required.";
    if (!form.city.trim()) next.city = "Required.";
    if (!form.state.trim()) next.state = "Required.";
    if (!/^\d{4,10}$/.test(form.zip.trim())) next.zip = "Enter a valid postal code.";
    if (form.paymentMethod === "card") {
      if (!/^\d{13,19}$/.test(form.cardNumber.replace(/\s+/g, "")))
        next.cardNumber = "Enter a valid card number.";
      if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(form.expiry.trim()))
        next.expiry = "Use MM/YY format.";
      if (!/^\d{3,4}$/.test(form.cvc.trim())) next.cvc = "Enter a valid CVC.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (items.length === 0) return;
    if (!validate()) return;
    setOrderNumber(`SAB-${Math.floor(100000 + Math.random() * 900000)}`);
    setPlaced(true);
    clearCart();
  }

  if (placed) {
    return (
      <div className="mx-auto flex min-h-[70vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <Reveal>
          <span className="mb-4 inline-flex h-14 w-14 items-center justify-center rounded-full bg-lime text-2xl">
            ✓
          </span>
          <h1 className="font-display text-3xl font-black uppercase tracking-tight sm:text-4xl">
            Order Confirmed
          </h1>
          <p className="mt-3 text-ink/60">
            Thanks, {form.firstName || "there"}. Your order{" "}
            <span className="font-semibold text-ink">{orderNumber}</span> has
            been placed. This is a demo checkout — no payment was actually
            processed and no email will be sent.
          </p>
          <Link
            href="/shop"
            className="mt-8 inline-flex rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
          >
            Continue Shopping
          </Link>
        </Reveal>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-4 text-center">
        <p className="text-ink/60">Your bag is empty, so there&apos;s nothing to check out.</p>
        <Link
          href="/shop"
          className="mt-6 inline-flex rounded-full bg-ink px-7 py-3.5 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-orange"
        >
          Go to Shop
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-32 sm:px-6">
      <Reveal>
        <h1 className="font-display text-4xl font-black uppercase tracking-tight sm:text-5xl">
          Checkout
        </h1>
        <p className="mt-2 text-sm text-ink/50">
          Demo checkout UI — no payment provider is connected and nothing will be charged.
        </p>
      </Reveal>

      <form onSubmit={handleSubmit} className="mt-10 grid grid-cols-1 gap-12 lg:grid-cols-[1fr_360px]">
        <div className="flex flex-col gap-10">
          <fieldset>
            <legend className="mb-4 font-display text-lg font-bold uppercase tracking-wide">
              Contact
            </legend>
            <Field
              label="Email"
              id="email"
              type="email"
              value={form.email}
              onChange={(v) => update("email", v)}
              error={errors.email}
              autoComplete="email"
            />
          </fieldset>

          <fieldset>
            <legend className="mb-4 font-display text-lg font-bold uppercase tracking-wide">
              Shipping Address
            </legend>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field
                label="First Name"
                id="firstName"
                value={form.firstName}
                onChange={(v) => update("firstName", v)}
                error={errors.firstName}
                autoComplete="given-name"
              />
              <Field
                label="Last Name"
                id="lastName"
                value={form.lastName}
                onChange={(v) => update("lastName", v)}
                error={errors.lastName}
                autoComplete="family-name"
              />
              <Field
                label="Address"
                id="address"
                value={form.address}
                onChange={(v) => update("address", v)}
                error={errors.address}
                autoComplete="street-address"
                className="sm:col-span-2"
              />
              <Field
                label="City"
                id="city"
                value={form.city}
                onChange={(v) => update("city", v)}
                error={errors.city}
                autoComplete="address-level2"
              />
              <Field
                label="State / Province"
                id="state"
                value={form.state}
                onChange={(v) => update("state", v)}
                error={errors.state}
                autoComplete="address-level1"
              />
              <Field
                label="Postal Code"
                id="zip"
                value={form.zip}
                onChange={(v) => update("zip", v)}
                error={errors.zip}
                autoComplete="postal-code"
              />
              <div>
                <label htmlFor="country" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
                  Country
                </label>
                <select
                  id="country"
                  value={form.country}
                  onChange={(e) => update("country", e.target.value)}
                  className="w-full border border-ink/20 bg-paper px-3 py-2.5 text-sm outline-none focus-visible:border-ink"
                >
                  <option>United States</option>
                  <option>Canada</option>
                  <option>United Kingdom</option>
                  <option>Australia</option>
                </select>
              </div>
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-4 font-display text-lg font-bold uppercase tracking-wide">
              Payment
            </legend>
            <div className="mb-4 flex gap-3">
              {(["card", "paypal"] as const).map((method) => (
                <button
                  key={method}
                  type="button"
                  onClick={() => update("paymentMethod", method)}
                  aria-pressed={form.paymentMethod === method}
                  className={`rounded-full border px-5 py-2 text-xs font-semibold uppercase tracking-wide ${
                    form.paymentMethod === method
                      ? "border-ink bg-ink text-cream"
                      : "border-ink/20 text-ink/70"
                  }`}
                >
                  {method === "card" ? "Credit Card" : "PayPal"}
                </button>
              ))}
            </div>

            {form.paymentMethod === "card" ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field
                  label="Card Number"
                  id="cardNumber"
                  value={form.cardNumber}
                  onChange={(v) => update("cardNumber", v)}
                  error={errors.cardNumber}
                  placeholder="4242 4242 4242 4242"
                  className="sm:col-span-2"
                  autoComplete="cc-number"
                />
                <Field
                  label="Expiry (MM/YY)"
                  id="expiry"
                  value={form.expiry}
                  onChange={(v) => update("expiry", v)}
                  error={errors.expiry}
                  placeholder="09/28"
                  autoComplete="cc-exp"
                />
                <Field
                  label="CVC"
                  id="cvc"
                  value={form.cvc}
                  onChange={(v) => update("cvc", v)}
                  error={errors.cvc}
                  placeholder="123"
                  autoComplete="cc-csc"
                />
              </div>
            ) : (
              <p className="rounded-md border border-ink/10 bg-cream-dark p-4 text-sm text-ink/60">
                You&apos;ll be redirected to PayPal to complete your purchase.
                (Demo only — no redirect will occur.)
              </p>
            )}
            <p className="mt-3 text-xs text-ink/40">
              This is a UI demo. No payment provider is connected and no charge will be made.
            </p>
          </fieldset>
        </div>

        <div className="h-fit rounded-md border border-ink/10 bg-paper p-6">
          <h2 className="font-display text-lg font-bold uppercase tracking-wide">
            Order Summary
          </h2>
          <ul className="mt-5 flex flex-col gap-3 border-b border-ink/10 pb-5 text-sm">
            {items.map((item) => (
              <li key={item.key} className="flex justify-between gap-3">
                <span className="text-ink/70">
                  {item.name} × {item.quantity}
                </span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 flex flex-col gap-2 text-sm">
            <div className="flex justify-between">
              <span className="text-ink/60">Subtotal</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-ink/60">Shipping</span>
              <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
            </div>
            <div className="flex justify-between border-t border-ink/10 pt-3 text-base font-semibold">
              <span>Total</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>
          <button
            type="submit"
            className="mt-6 flex w-full items-center justify-center rounded-full bg-ink py-4 text-xs font-semibold uppercase tracking-widest text-cream transition-colors hover:bg-lime hover:text-ink"
          >
            Place Order
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  id,
  value,
  onChange,
  error,
  type = "text",
  placeholder,
  autoComplete,
  className = "",
}: {
  label: string;
  id: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-xs font-semibold uppercase tracking-wide">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full border bg-paper px-3 py-2.5 text-sm outline-none focus-visible:border-ink ${
          error ? "border-orange" : "border-ink/20"
        }`}
      />
      {error && (
        <p id={`${id}-error`} className="mt-1 text-xs text-orange">
          {error}
        </p>
      )}
    </div>
  );
}
