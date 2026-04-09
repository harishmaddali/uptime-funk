import { Suspense } from "react";
import { SettingsTabsInner } from "@/components/settings-tabs-inner";

export function SettingsTabs({ userEmail }: { userEmail: string }) {
  return (
    <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
      <SettingsTabsInner userEmail={userEmail} />
    </Suspense>
  );
}
