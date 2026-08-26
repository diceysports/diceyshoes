"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatMoney } from "@/lib/utils/price";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const [placed, setPlaced] = useState(false);
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlaced(true);
    clear();
  }

  if (items.length === 0 && !placed) {
    return (
      <section className="mx-auto max-w-[600px] px-5 py-20 text-center md:px-8">
        <h1 className="font-display mb-4 text-3xl uppercase">Your Bag Is Empty</h1>
        <button onClick={() => router.push("/shop")} className="rounded-full bg-paper px-6 py-3 text-xs font-bold uppercase tracking-wide text-ink hover:bg-accent hover:text-white">
          Browse The Catalog
        </button>
      </section>
    );
  }

  if (placed) {
    return (
      <section className="mx-auto max-w-[600px] px-5 py-24 text-center md:px-8">
        <div className="mb-5 inline-block rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
          Proof of Concept
        </div>
        <h1 className="font-display mb-4 text-3xl uppercase">Demo Order Recorded</h1>
        <p className="mx-auto mb-8 max-w-sm text-sm leading-relaxed text-fog">
          No real payment was processed and no real order was placed. This screen exists only to
          demonstrate the end-to-end checkout flow for the proof of concept.
        </p>
        <button onClick={() => router.push("/shop")} className="rounded-full bg-paper px-6 py-3 text-xs font-bold uppercase tracking-wide text-ink hover:bg-accent hover:text-white">
          Continue Browsing
        </button>
      </section>
    );
  }

  return (
    <section className="mx-auto max-w-[1100px] px-5 py-14 md:px-8">
      <div className="mb-8 inline-block rounded-full bg-amber-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-300">
        Proof of Concept — Payment Processing Not Active
      </div>
      <h1 className="font-display mb-10 text-[clamp(30px,5vw,44px)] uppercase leading-none">
        Checkout
      </h1>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-12 md:grid-cols-[1.2fr,0.8fr]">
        <div className="space-y-10">
          <fieldset>
            <legend className="mb-4 text-xs font-bold uppercase tracking-wide">Contact</legend>
            <input required type="email" placeholder="Email" className="input" />
          </fieldset>

          <fieldset>
            <legend className="mb-4 text-xs font-bold uppercase tracking-wide">Shipping</legend>
            <div className="grid grid-cols-2 gap-3">
              <input required placeholder="First name" className="input" />
              <input required placeholder="Last name" className="input" />
              <input required placeholder="Address" className="input col-span-2" />
              <input required placeholder="City" className="input" />
              <input required placeholder="Province / State" className="input" />
              <input required placeholder="Postal / ZIP code" className="input" />
              <input required placeholder="Country" className="input" />
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-4 text-xs font-bold uppercase tracking-wide">Delivery</legend>
            <div className="space-y-2">
              {["Standard (5–7 days) — Free", "Express (2–3 days) — $18", "Next Day — $32"].map((opt) => (
                <label key={opt} className="flex items-center gap-3 rounded-xl border border-line px-4 py-3 text-sm">
                  <input type="radio" name="delivery" defaultChecked={opt.startsWith("Standard")} />
                  {opt}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="mb-4 text-xs font-bold uppercase tracking-wide">Payment</legend>
            <div className="rounded-xl border border-dashed border-line p-5 text-sm text-fog">
              Payment processing is not active in this proof of concept. Submitting this form
              records a demo order only — no card is charged.
            </div>
          </fieldset>
        </div>

        <div className="h-fit rounded-2xl border border-line p-6">
          <h2 className="mb-5 text-sm font-bold uppercase tracking-wide">Order Summary</h2>
          <div className="mb-5 max-h-64 space-y-4 overflow-y-auto">
            {items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <div>
                  <div className="font-semibold">{item.name}</div>
                  <div className="text-xs text-fog">
                    Size {item.size} · Qty {item.qty}
                  </div>
                </div>
                <div>{formatMoney(item.price * item.qty, item.currency)}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t border-line pt-4 text-base font-bold">
            <span>Subtotal</span>
            <span>{formatMoney(subtotal)}</span>
          </div>
          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-paper py-4 text-xs font-bold uppercase tracking-wide text-ink hover:bg-accent hover:text-white"
          >
            Place Demo Order
          </button>
        </div>
      </form>

      <style jsx>{`
        .input {
          background: transparent;
          border: 1px solid rgba(20, 21, 26, 0.14);
          border-radius: 10px;
          padding: 0.85rem 1rem;
          font-size: 0.875rem;
          width: 100%;
        }
        .input:focus {
          outline: 2px solid #2f5cff;
          outline-offset: 2px;
        }
      `}</style>
    </section>
  );
}
