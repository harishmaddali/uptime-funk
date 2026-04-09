import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { SettingsTabs } from "@/components/settings-tabs";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
      <p className="text-muted-foreground">
        Default alert channels and third-party integrations.
      </p>
      <div className="mt-8">
        <SettingsTabs userEmail={session.user.email ?? ""} />
      </div>
    </div>
  );
}
