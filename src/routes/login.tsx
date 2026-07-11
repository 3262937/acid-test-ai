import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Github, Loader2, Mail } from "lucide-react";
import { lovable } from "@/integrations/lovable/index";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";

export const Route = createFileRoute("/login")({
  component: LoginPage,
  head: () => ({
    meta: [
      { title: "Sign in — AcidTest" },
      {
        name: "description",
        content: "Sign in to AcidTest with Google, GitHub or email to synthesize your first test suite.",
      },
      { property: "og:title", content: "Sign in — AcidTest" },
      {
        property: "og:description",
        content: "Enter the lab. Google, GitHub or email — pick your poison.",
      },
    ],
  }),
});

function GoogleGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden>
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.5l6.7-6.7C35.6 2.4 30.2 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.8 6C12.2 13.6 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.5 3-2.2 5.5-4.7 7.2l7.5 5.8c4.4-4.1 7-10.1 7-17.5z" />
      <path fill="#FBBC05" d="M10.3 28.7c-.5-1.5-.8-3.1-.8-4.7s.3-3.2.8-4.7l-7.8-6C.9 16.3 0 20.1 0 24s.9 7.7 2.5 10.7l7.8-6z" />
      <path fill="#34A853" d="M24 48c6.2 0 11.5-2 15.4-5.5l-7.5-5.8c-2.1 1.4-4.8 2.3-7.9 2.3-6.4 0-11.8-4.1-13.7-9.8l-7.8 6C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}

function LoginPage() {
  const navigate = useNavigate();
  const { user, ready } = useSession();
  const [busy, setBusy] = useState<null | "google" | "github" | "email">(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showEmail, setShowEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  useEffect(() => {
    if (ready && user) navigate({ to: "/" });
  }, [ready, user, navigate]);

  async function google() {
    setError(null);
    setBusy("google");
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setBusy(null);
      setError(result.error.message ?? "Google sign-in failed.");
      return;
    }
    if (result.redirected) return; // browser navigates away
    navigate({ to: "/" });
  }

  async function github() {
    setError(null);
    setBusy("github");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "github",
      options: { redirectTo: window.location.origin },
    });
    if (error) {
      setBusy(null);
      setError(
        error.message.includes("provider")
          ? "GitHub provider isn't enabled yet. Enable it in your backend Auth settings."
          : error.message,
      );
    }
  }

  async function email_() {
    setError(null);
    setBusy("email");
    if (mode === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: window.location.origin },
      });
      setBusy(null);
      if (error) return setError(error.message);
      setEmailSent(true);
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(null);
      if (error) return setError(error.message);
      navigate({ to: "/" });
    }
  }

  return (
    <main className="relative min-h-screen bg-carbon text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_10%,rgba(197,239,87,0.10),transparent_55%),radial-gradient(circle_at_80%_90%,rgba(169,145,255,0.10),transparent_55%)]" />

      <div className="mx-auto flex min-h-screen max-w-[480px] flex-col items-stretch justify-center px-6 py-16">
        <Link to="/" className="mb-10 self-start">
          <span className="text-acid font-display text-2xl font-bold italic tracking-tight">
            AcidTest
          </span>
        </Link>

        <div className="folder-tab p-8 pt-10">
          <div className="label-mono mb-3 text-acid">§ 05 — Access</div>
          <h1 className="font-display text-3xl font-bold tracking-[-0.02em] md:text-4xl">
            Enter the lab.
          </h1>
          <p className="mt-2 text-sm text-muted-ink">
            Sign in to synthesize, save, and hunt bugs across your projects.
          </p>

          {error && (
            <div className="mt-6 rounded-md border border-[#ff7a7a]/30 bg-[rgba(255,122,122,0.06)] px-3 py-2 font-mono text-[12px] text-[#ff9c9c]">
              {error}
            </div>
          )}

          {emailSent && (
            <div className="mt-6 rounded-md border border-acid/30 bg-[rgba(197,239,87,0.05)] px-3 py-2 font-mono text-[12px] text-acid">
              ✓ Confirmation email sent — check your inbox.
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              onClick={google}
              disabled={!!busy}
              className="inline-flex items-center justify-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-[12px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:bg-white/[0.05] disabled:opacity-50"
            >
              {busy === "google" ? <Loader2 size={14} className="animate-spin" /> : <GoogleGlyph />}
              Continue with Google
            </button>

            <button
              onClick={github}
              disabled={!!busy}
              className="inline-flex items-center justify-center gap-3 rounded-md border border-white/10 bg-white/[0.03] px-4 py-3 font-mono text-[12px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:bg-white/[0.05] disabled:opacity-50"
            >
              {busy === "github" ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Github size={16} />
              )}
              Continue with GitHub
            </button>
          </div>

          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-white/8" />
            <span className="label-mono text-[10px]">or</span>
            <div className="h-px flex-1 bg-white/8" />
          </div>

          {!showEmail ? (
            <button
              onClick={() => setShowEmail(true)}
              className="inline-flex w-full items-center justify-center gap-2 rounded-md border border-white/10 bg-white/[0.02] px-4 py-3 font-mono text-[12px] uppercase tracking-widest text-muted-ink transition-colors hover:border-acid/40 hover:text-acid"
            >
              <Mail size={14} />
              Email &amp; password
            </button>
          ) : (
            <div className="flex flex-col gap-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="qa@acidtest.dev"
                className="rounded-md border border-white/10 bg-carbon/60 px-3 py-2.5 font-mono text-[13px] text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
              />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="password"
                className="rounded-md border border-white/10 bg-carbon/60 px-3 py-2.5 font-mono text-[13px] text-ink outline-none focus:border-acid/50 focus:ring-2 focus:ring-acid/30"
              />
              <button
                onClick={email_}
                disabled={!!busy || !email || !password}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-acid px-4 py-3 font-mono text-[12px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
              >
                {busy === "email" ? (
                  <Loader2 size={14} className="animate-spin" />
                ) : mode === "signin" ? (
                  "Sign in →"
                ) : (
                  "Create account →"
                )}
              </button>
              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="label-mono text-center transition-colors hover:text-acid"
              >
                {mode === "signin" ? "No account? Sign up →" : "Have an account? Sign in →"}
              </button>
            </div>
          )}

          <p className="mt-8 text-center text-[11px] text-muted-ink">
            By continuing you agree to the terms &amp; privacy policy.
          </p>
        </div>

        <p className="mt-6 text-center text-[11px] text-muted-ink">
          GitHub sign-in requires enabling the GitHub provider in your Cloud auth settings.
        </p>
      </div>
    </main>
  );
}
