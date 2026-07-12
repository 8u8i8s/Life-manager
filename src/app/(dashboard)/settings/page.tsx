import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CopyField } from "@/components/shared/copy-field";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getCurrentUserContext } from "@/lib/data/profile";

export const metadata: Metadata = {
  title: "Settings — PULI OS",
};

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export default async function SettingsPage() {
  const context = await getCurrentUserContext();

  if (!context?.company) {
    redirect("/dashboard");
  }

  const { company, profile } = context;
  const canSeeAutomation = profile.role === "owner" || profile.role === "admin";
  const ingestUrl = `${SUPABASE_URL}/functions/v1/ingest-inquiry`;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Company profile and automation configuration.
        </p>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle>Company</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Name</dt>
              <dd className="font-medium">{company.name}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Slug</dt>
              <dd className="font-mono text-xs">{company.slug}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Your role</dt>
              <dd>
                <Badge variant="secondary" className="capitalize">
                  {profile.role}
                </Badge>
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      {canSeeAutomation ? (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Email automation</CardTitle>
            <CardDescription>
              Point your n8n workflow at this endpoint to feed incoming
              emails into PULI OS. Keep the ingest token secret — it grants
              write access to your company&apos;s inquiries.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label>Ingest endpoint (POST)</Label>
              <CopyField value={ingestUrl} label="Endpoint URL" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Ingest token (send as `x-ingest-token` header)</Label>
              <CopyField value={company.ingest_token} label="Ingest token" />
            </div>
            <div className="flex flex-col gap-2">
              <Label>Payload format</Label>
              <div className="overflow-x-auto rounded-md bg-muted p-3">
                <pre className="text-xs">{`{
  "from_email": "customer@example.com",
  "from_name": "Ján Novák",
  "subject": "Cenová ponuka na okná",
  "body": "Dobrý deň, prosím o ponuku na...",
  "received_at": "2026-07-12T10:00:00Z"
}`}</pre>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : null}
    </div>
  );
}
