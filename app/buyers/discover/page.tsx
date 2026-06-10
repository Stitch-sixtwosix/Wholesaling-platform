import Link from "next/link";
import { PageHeader, Section, EmptyState, LinkButton } from "@/components/ui";
import { Field, Input } from "@/components/Form";
import { apolloConfigured, searchProspects, ApolloError, type ApolloProspect } from "@/lib/apollo";
import { requireUser, getOrgApolloKey } from "@/lib/auth";
import { importProspect } from "./actions";

export const dynamic = "force-dynamic";

const DEFAULT_TITLES = [
  "owner",
  "founder",
  "co-founder",
  "principal",
  "managing partner",
  "acquisitions",
  "real estate investor",
  "president",
];

export default async function DiscoverBuyersPage({
  searchParams,
}: {
  searchParams: { q?: string; location?: string; page?: string };
}) {
  const { orgId } = await requireUser();
  const apolloKey = await getOrgApolloKey(orgId);
  const configured = apolloConfigured(apolloKey);
  const q = searchParams.q?.trim() || "";
  const location = searchParams.location?.trim() || "";
  const page = Math.max(1, Number(searchParams.page) || 1);
  const hasSearched = Boolean(q || location);

  let results: ApolloProspect[] = [];
  let total = 0;
  let error: string | null = null;

  if (configured && hasSearched) {
    try {
      const data = await searchProspects(apolloKey, {
        keywords: q || "real estate investor",
        titles: DEFAULT_TITLES,
        locations: location ? [location] : undefined,
        page,
        perPage: 10,
      });
      results = data.prospects;
      total = data.total;
    } catch (e) {
      error = e instanceof ApolloError ? e.message : "Apollo search failed.";
    }
  }

  return (
    <div>
      <PageHeader
        title="Discover Cash Buyers"
        subtitle="Find investor-buyers via Apollo.io and import them into your buyers list."
        action={<LinkButton href="/buyers">← Back to Buyers</LinkButton>}
      />

      <div className="mb-4 rounded-lg border border-brand-100 bg-brand-50 px-4 py-3 text-sm text-brand-900">
        <strong>Powered by Apollo.io.</strong> Search returns net-new investor prospects.
        Emails &amp; phone numbers are revealed by enriching a buyer after import (1 Apollo
        credit per match). Apollo targets businesses/professionals — not homeowner skip tracing.
      </div>

      {!configured && (
        <EmptyState
          title="Apollo isn't connected yet"
          description="Connect your Apollo account in Settings to enable buyer discovery and enrichment. Get a key from Apollo.io → Settings → API."
          action={<LinkButton href="/settings">Go to Settings</LinkButton>}
        />
      )}

      {configured && (
        <>
          <Section title="Search">
            <form action="/buyers/discover" className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-3">
              <Field label="Keywords" className="sm:col-span-1" hint='e.g. "fix and flip", "we buy houses"'>
                <Input name="q" defaultValue={q} placeholder="real estate investor" />
              </Field>
              <Field label="Market / Location" hint="City, state, or metro">
                <Input name="location" defaultValue={location} placeholder="Memphis, TN" />
              </Field>
              <div className="flex items-end">
                <button type="submit" className="btn-primary w-full">
                  Search Apollo
                </button>
              </div>
            </form>
          </Section>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          {hasSearched && !error && (
            <div className="mt-6">
              <p className="mb-3 text-sm text-slate-500">
                {total > 0
                  ? `Showing ${results.length} of ~${total.toLocaleString()} matches`
                  : "No matches — try broader keywords or a different market."}
              </p>

              {results.length === 0 ? (
                <EmptyState title="No prospects found" description="Adjust your search and try again." />
              ) : (
                <div className="space-y-3">
                  {results.map((p) => (
                    <div key={p.id} className="card flex flex-wrap items-center justify-between gap-3 p-4">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">
                          {p.name || "—"}
                          {p.title && <span className="font-normal text-slate-500"> · {p.title}</span>}
                        </p>
                        <p className="text-sm text-slate-500">
                          {p.company ?? "—"}
                          {p.location && ` · ${p.location}`}
                        </p>
                        <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-400">
                          {p.companyDomain && <span>🌐 {p.companyDomain}</span>}
                          {p.linkedinUrl && (
                            <a href={p.linkedinUrl} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">
                              LinkedIn
                            </a>
                          )}
                          <span>{p.hasEmail ? "✉️ email available (enrich to reveal)" : "email via enrichment"}</span>
                        </div>
                      </div>
                      <form action={importProspect}>
                        <input type="hidden" name="firstName" value={p.firstName} />
                        <input type="hidden" name="lastName" value={p.lastName} />
                        <input type="hidden" name="company" value={p.company ?? ""} />
                        <input type="hidden" name="location" value={p.location ?? ""} />
                        <input type="hidden" name="title" value={p.title ?? ""} />
                        <input type="hidden" name="linkedinUrl" value={p.linkedinUrl ?? ""} />
                        <input type="hidden" name="companyDomain" value={p.companyDomain ?? ""} />
                        <button type="submit" className="btn-secondary text-sm">
                          + Import as Buyer
                        </button>
                      </form>
                    </div>
                  ))}
                </div>
              )}

              {/* Pagination */}
              {results.length > 0 && (
                <div className="mt-5 flex items-center justify-between">
                  {page > 1 ? (
                    <Link
                      href={`/buyers/discover?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&page=${page - 1}`}
                      className="btn-secondary text-sm"
                    >
                      ← Previous
                    </Link>
                  ) : (
                    <span />
                  )}
                  <span className="text-sm text-slate-400">Page {page}</span>
                  <Link
                    href={`/buyers/discover?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}&page=${page + 1}`}
                    className="btn-secondary text-sm"
                  >
                    Next →
                  </Link>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
