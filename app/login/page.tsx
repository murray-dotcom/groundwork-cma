"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!email.endsWith("@homegroundestates.co.za")) {
      setError("Access is restricted to @homegroundestates.co.za email addresses.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: "https://groundwork-cma.netlify.app/auth/callback" },
    });
    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    setSent(true);
  }

  return (
    <div className="min-h-screen bg-cream flex flex-col">
      {/* Header */}
      <div className="bg-olive px-8 py-5 flex items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/images/logo_2.png" alt="Home Ground Real Estate" style={{ height: "48px" }} />
      </div>

      {/* Card */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="bg-white border border-sage/20 rounded-lg shadow-sm p-10 w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="font-cinzel text-2xl tracking-[0.2em] text-olive mb-2">GROUNDWORK</h1>
            <p className="font-cormorant text-sm text-sage tracking-wide">
              Property Intelligence — Home Ground Real Estate
            </p>
          </div>

          {sent ? (
            <div className="text-center py-4">
              <p className="font-cormorant text-base text-olive mb-2">Check your email for a login link</p>
              <p className="font-dm-sans text-xs text-sage/70">Sent to {email}</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block font-cormorant text-xs uppercase tracking-widest text-sage mb-2">
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@homegroundestates.co.za"
                  required
                  className="w-full border border-sage/40 rounded px-4 py-3 font-dm-sans text-sm text-gray-800 bg-white focus:outline-none focus:ring-1 focus:ring-bronze/50"
                />
              </div>

              {error && (
                <p className="font-dm-sans text-xs text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-olive text-cream font-cinzel tracking-[0.15em] text-xs py-3 rounded hover:bg-olive/90 transition-colors disabled:opacity-60"
              >
                {loading ? "Sending…" : "Send Login Link"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
