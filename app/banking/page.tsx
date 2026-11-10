import type { Metadata } from "next";
import Image from "next/image";
import { BankDetails } from "@/components/BankDetails";
import { paypalPaymentUrl } from "@/lib/payment";

export const metadata: Metadata = {
  title: "Support FusBus | Bank Transfer and PayPal",
  description: "Support Ladies in the Boardroom through a secure bank transfer or an available online payment method."
};

export const dynamic = "force-dynamic";

function CheckIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 shrink-0 fill-none stroke-current stroke-[2.5]">
      <path d="m5 12 4 4L19 6" />
    </svg>
  );
}

export default function BankingPage() {
  const paypalUrl = paypalPaymentUrl();

  return (
    <>
      <section className="relative overflow-hidden bg-forest text-white">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-ember/20 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
          <p className="text-sm font-black uppercase tracking-[0.18em] text-yellow-300">Support the mission</p>
          <h1 className="mt-3 max-w-4xl text-4xl font-black leading-tight sm:text-5xl">Help open more doors for Cameroon&apos;s entrepreneurs</h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-green-50">
            Send your contribution to Ladies in the Boardroom by direct bank transfer or use an available online payment option.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(18rem,0.75fr)] lg:items-start">
          <div className="space-y-8">
            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="mb-7 flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-100 text-lg font-black text-forest" aria-hidden="true">1</span>
                <div>
                  <h2 className="text-2xl font-black">Direct bank transfer</h2>
                  <p className="mt-1 leading-6 text-stone-600">Use these details in your banking app, at your bank, or with a reputable transfer provider.</p>
                </div>
              </div>
              <BankDetails />
            </div>

            <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-8">
              <div className="flex items-start gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg font-black text-blue-800" aria-hidden="true">2</span>
                <div className="min-w-0">
                  <h2 className="text-2xl font-black">Pay online</h2>
                  <p className="mt-1 leading-6 text-stone-600">PayPal is available when the official Ladies in the Boardroom recipient link is configured.</p>
                  {paypalUrl ? (
                    <a className="btn mt-5 bg-[#0070ba] text-white hover:bg-[#005ea6]" href={paypalUrl} target="_blank" rel="noopener noreferrer">
                      Continue to PayPal
                      <span className="sr-only"> (opens in a new tab)</span>
                    </a>
                  ) : (
                    <p className="mt-5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-950">
                      PayPal is being set up. Please use the bank transfer details above in the meantime.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-stone-100 p-5 sm:p-7">
              <h2 className="text-xl font-black">Before you send money</h2>
              <ul className="mt-4 grid gap-3 text-sm leading-6 text-stone-700 sm:grid-cols-2">
                <li className="flex gap-2 text-forest"><CheckIcon /><span className="text-stone-700">Confirm the beneficiary is <strong>Ladies in the Boardroom</strong>.</span></li>
                <li className="flex gap-2 text-forest"><CheckIcon /><span className="text-stone-700">Review any currency conversion and provider fees.</span></li>
                <li className="flex gap-2 text-forest"><CheckIcon /><span className="text-stone-700">Keep the receipt or transaction confirmation.</span></li>
                <li className="flex gap-2 text-forest"><CheckIcon /><span className="text-stone-700">Never share your password, card PIN, or one-time code.</span></li>
              </ul>
            </div>
          </div>

          <aside className="rounded-2xl border border-stone-200 bg-white p-5 text-center shadow-sm sm:p-7 lg:sticky lg:top-24">
            <p className="text-sm font-black uppercase tracking-[0.14em] text-ember">Share this page</p>
            <h2 className="mt-2 text-2xl font-black">Scan to support</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">This replacement QR code opens this banking page. It contains no account or payment data.</p>
            <div className="mx-auto mt-5 max-w-xs rounded-xl border border-stone-200 bg-white p-3">
              <Image src="/banking/qr-code" alt="QR code linking to the FusBus banking page" width={720} height={720} unoptimized />
            </div>
            <a className="btn btn-secondary mt-5" href="/banking/qr-code" download="fusbus-banking-qr.svg">Download QR code</a>
            <p className="mt-5 border-t border-stone-200 pt-5 text-left text-xs leading-5 text-stone-500">
              No fixed amount is included. Enter the amount and payment reference in your chosen provider.
            </p>
          </aside>
        </div>
      </section>
    </>
  );
}
