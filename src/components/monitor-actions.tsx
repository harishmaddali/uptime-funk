"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";

export function MonitorActions({ monitorId }: { monitorId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  async function remove() {
    if (!confirm("Delete this monitor and its history?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/monitors/${monitorId}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      toast({ title: "Monitor deleted" });
      router.push("/monitors");
      router.refresh();
    } catch {
      toast({
        variant: "destructive",
        title: "Could not delete",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <Button
      type="button"
      variant="destructive"
      size="sm"
      className="gap-2"
      disabled={loading}
      onClick={remove}
    >
      <Trash2 className="h-4 w-4" />
      Delete
    </Button>
  );
}
