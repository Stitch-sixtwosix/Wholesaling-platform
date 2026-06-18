import { prisma } from "@/lib/db";
import { requireAdmin } from "@/lib/auth";
import { PageHeader, Section, Badge } from "@/components/ui";
import { Field, Input, SubmitButton } from "@/components/Form";
import {
  updateOrgName,
  saveApolloKey,
  disconnectApollo,
  saveEmailSettings,
  disconnectEmail,
  saveRentcastKey,
  disconnectRentcast,
  saveGmailSettings,
  disconnectGmail,
} from "./actions";

export const dynamic = "force-dynamic";

function maskKey(key: string): string {
  if (key.length <= 6) return "••••••";
  return `${key.slice(0, 3)}••••••${key.slice(-4)}`;
}

export default async function SettingsPage() {
  const me = await requireAdmin();
  const org = await prisma.organization.findUnique({ where: { id: me.orgId } });
  const apolloConnected = Boolean(org?.apolloApiKey);
  const emailConnected = Boolean(org?.resendApiKey && org?.fromEmail);
  const gmailConnected = Boolean(org?.gmailUser && org?.gmailAppPassword);
  const rentcastConnected = Boolean(org?.rentcastApiKey);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Manage your organization and integrations." />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Section title="Organization">
          <form action={updateOrgName} className="space-y-4 p-5">
            <Field label="Organization name">
              <Input name="name" defaultValue={org?.name ?? ""} required />
            </Field>
            <SubmitButton>Save</SubmitButton>
          </form>
        </Section>

        <Section title="Apollo.io Integration">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Status:</span>
              {apolloConnected ? (
                <Badge
                  options={[{ value: "on", label: "Connected", color: "bg-emerald-100 text-emerald-700" }]}
                  value="on"
                />
              ) : (
                <Badge
                  options={[{ value: "off", label: "Not connected", color: "bg-slate-100 text-slate-500" }]}
                  value="off"
                />
              )}
              {apolloConnected && org?.apolloApiKey && (
                <span className="font-mono text-xs text-slate-400">{maskKey(org.apolloApiKey)}</span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Connect your Apollo.io account to discover and enrich investor/cash-buyer
              prospects on the Dispositions side. Get a key from{" "}
              <span className="font-medium text-slate-600">Apollo.io → Settings → API</span>.
              Your key is stored for this organization only.
            </p>

            <form action={saveApolloKey} className="space-y-3">
              <Field label={apolloConnected ? "Replace API key" : "Apollo API key"}>
                <Input
                  name="apiKey"
                  type="password"
                  required
                  placeholder="Paste your Apollo API key"
                  autoComplete="off"
                />
              </Field>
              <div className="flex items-center gap-2">
                <SubmitButton>{apolloConnected ? "Update Key" : "Connect Apollo"}</SubmitButton>
              </div>
            </form>

            {apolloConnected && (
              <form action={disconnectApollo}>
                <button type="submit" className="btn-ghost text-xs text-rose-600">
                  Disconnect Apollo
                </button>
              </form>
            )}
          </div>
        </Section>

        <Section title="RentCast (Listing Data)">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Status:</span>
              {rentcastConnected ? (
                <Badge
                  options={[{ value: "on", label: "Connected", color: "bg-emerald-100 text-emerald-700" }]}
                  value="on"
                />
              ) : (
                <Badge
                  options={[{ value: "off", label: "Not connected", color: "bg-slate-100 text-slate-500" }]}
                  value="off"
                />
              )}
              {rentcastConnected && org?.rentcastApiKey && (
                <span className="font-mono text-xs text-slate-400">{maskKey(org.rentcastApiKey)}</span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Powers the Deal Finder's automatic listing pull. Create a free account at{" "}
              <span className="font-medium text-slate-600">rentcast.io</span> → Dashboard → API, and
              paste the key. The free tier allows ~50 lookups/month — licensed data, no scraping.
            </p>

            <form action={saveRentcastKey} className="space-y-3">
              <Field label={rentcastConnected ? "Replace API key" : "RentCast API key"}>
                <Input name="rentcastApiKey" type="password" required placeholder="Paste your RentCast key" autoComplete="off" />
              </Field>
              <SubmitButton>{rentcastConnected ? "Update Key" : "Connect RentCast"}</SubmitButton>
            </form>

            {rentcastConnected && (
              <form action={disconnectRentcast}>
                <button type="submit" className="btn-ghost text-xs text-rose-600">
                  Disconnect RentCast
                </button>
              </form>
            )}
          </div>
        </Section>

        <Section title="Gmail / Google Workspace (Send Email)">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Status:</span>
              {gmailConnected ? (
                <Badge
                  options={[{ value: "on", label: "Connected", color: "bg-emerald-100 text-emerald-700" }]}
                  value="on"
                />
              ) : (
                <Badge
                  options={[{ value: "off", label: "Not connected", color: "bg-slate-100 text-slate-500" }]}
                  value="off"
                />
              )}
              {gmailConnected && org?.gmailUser && (
                <span className="text-xs text-slate-400">sending as {org.gmailUser}</span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Sends contracts and buyer blasts from your real address — replies land in your inbox.
              Turn on <strong>2-Step Verification</strong>, then create an <strong>App Password</strong>{" "}
              (Google Account → Security → App passwords) and paste it below. Used for both contract
              sends and the disposition buyer blast. Takes priority over Resend when connected.
            </p>

            <form action={saveGmailSettings} className="space-y-3">
              <Field label="Send-from address">
                <Input
                  name="gmailUser"
                  type="email"
                  required
                  defaultValue={org?.gmailUser ?? ""}
                  placeholder="info@fastflip.co"
                  autoComplete="off"
                />
              </Field>
              <Field label="App Password" hint="16 characters; spaces are ignored.">
                <Input name="gmailAppPassword" type="password" required placeholder="xxxx xxxx xxxx xxxx" autoComplete="off" />
              </Field>
              <SubmitButton>{gmailConnected ? "Update Gmail" : "Connect Gmail"}</SubmitButton>
            </form>

            {gmailConnected && (
              <form action={disconnectGmail}>
                <button type="submit" className="btn-ghost text-xs text-rose-600">
                  Disconnect Gmail
                </button>
              </form>
            )}
          </div>
        </Section>

        <Section title="Email Sending (Resend)">
          <div className="space-y-4 p-5">
            <div className="flex items-center gap-2 text-sm">
              <span className="text-slate-500">Status:</span>
              {emailConnected ? (
                <Badge
                  options={[{ value: "on", label: "Connected", color: "bg-emerald-100 text-emerald-700" }]}
                  value="on"
                />
              ) : (
                <Badge
                  options={[{ value: "off", label: "Not connected", color: "bg-slate-100 text-slate-500" }]}
                  value="off"
                />
              )}
              {emailConnected && org?.fromEmail && (
                <span className="text-xs text-slate-400">sending as {org.fromEmail}</span>
              )}
            </div>

            <p className="text-xs text-slate-500">
              Lets the app email contracts to property owners. Create a free account at{" "}
              <span className="font-medium text-slate-600">resend.com</span>, grab an API key, and
              add a from-address. For quick testing, Resend accepts{" "}
              <span className="font-mono">onboarding@resend.dev</span> as the sender; to send from
              your own address, verify your domain in Resend first.
            </p>

            <form action={saveEmailSettings} className="space-y-3">
              <Field label="Resend API key">
                <Input
                  name="resendApiKey"
                  type="password"
                  required
                  placeholder="re_..."
                  autoComplete="off"
                />
              </Field>
              <Field label="From address">
                <Input
                  name="fromEmail"
                  type="email"
                  required
                  defaultValue={org?.fromEmail ?? ""}
                  placeholder="offers@yourcompany.com"
                />
              </Field>
              <SubmitButton>{emailConnected ? "Update Email Settings" : "Connect Email"}</SubmitButton>
            </form>

            {emailConnected && (
              <form action={disconnectEmail}>
                <button type="submit" className="btn-ghost text-xs text-rose-600">
                  Disconnect Email
                </button>
              </form>
            )}
          </div>
        </Section>
      </div>
    </div>
  );
}
