"use client";

import { authClient } from "@/lib/auth-client";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";

export function SignOutMenuItem() {
  return (
    <DropdownMenuItem
      onClick={async () => {
        await authClient.signOut();
        window.location.href = "/";
      }}
      className="cursor-pointer"
    >
      Log out
    </DropdownMenuItem>
  );
}
