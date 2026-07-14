import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-carbon px-6 text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_30%,rgba(197,239,87,0.10),transparent_60%),radial-gradient(circle_at_50%_100%,rgba(169,145,255,0.08),transparent_60%)]" />
      <div className="folder-tab w-full max-w-lg p-10 pt-14 text-center">
        <div className="label-mono mb-3 text-acid">§ 404 — Missing</div>
        <div className="font-display text-[120px] font-bold leading-none tracking-[-0.04em] text-ink md:text-[160px]">
          4<span className="italic text-acid">0</span>4
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.01em]">
          This page slipped the net.
        </h1>
        <p className="mt-2 text-sm text-muted-ink">
          The URL you followed doesn't exist, moved, or was never synthesized.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
          >
            Back to home →
          </Link>
          <Link
            to="/faq"
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid"
          >
            Read the FAQ
          </Link>
        </div>
      </div>
    </main>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <main className="relative flex min-h-screen items-center justify-center bg-carbon px-6 text-ink">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_50%_20%,rgba(255,122,122,0.10),transparent_60%),radial-gradient(circle_at_50%_100%,rgba(169,145,255,0.08),transparent_60%)]" />
      <div className="folder-tab w-full max-w-lg p-10 pt-14 text-center">
        <div className="label-mono mb-3 text-[#ff9c9c]">§ 500 — Ruptured</div>
        <div className="font-display text-[120px] font-bold leading-none tracking-[-0.04em] text-ink md:text-[160px]">
          5<span className="italic text-[#ff9c9c]">0</span>0
        </div>
        <h1 className="mt-4 font-display text-2xl font-semibold tracking-[-0.01em]">
          The reaction failed.
        </h1>
        <p className="mt-2 text-sm text-muted-ink">
          Something went wrong on our end. Retry the run or head back home.
        </p>
        {error?.message && (
          <pre className="mt-6 max-h-32 overflow-auto rounded-md border border-white/10 bg-black/40 px-3 py-2 text-left font-mono text-[11px] text-muted-ink">
            {error.message}
          </pre>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-acid px-5 py-3 font-mono text-[11px] font-bold uppercase tracking-widest text-[#0a0a0a] shadow-[0_0_24px_-4px_rgba(197,239,87,0.6)] transition-all hover:shadow-[0_0_40px_-2px_rgba(197,239,87,0.9)]"
          >
            Try again
          </button>
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md border border-white/10 bg-white/[0.03] px-5 py-3 font-mono text-[11px] font-semibold uppercase tracking-widest text-ink transition-all hover:border-acid/40 hover:text-acid"
          >
            Go home
          </Link>
        </div>
      </div>
    </main>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "AcidTest — AI test synthesis for QA engineers" },
      {
        name: "description",
        content:
          "Paste a user story. AcidTest breeds the scenarios, edge cases and runnable test suites that hunt the bug down.",
      },
      { property: "og:title", content: "AcidTest — AI test synthesis" },
      { property: "og:description", content: "Every bug meets its acid test." },
      { property: "og:type", content: "website" },
      { property: "og:site_name", content: "AcidTest" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      const { data: sub } = supabase.auth.onAuthStateChange((event) => {
        if (
          event !== "SIGNED_IN" &&
          event !== "SIGNED_OUT" &&
          event !== "USER_UPDATED"
        )
          return;
        router.invalidate();
        if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
      });
      return () => sub.subscription.unsubscribe();
    });
  }, [queryClient, router]);

  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster />
    </QueryClientProvider>
  );
}
