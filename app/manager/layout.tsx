import { AppShell } from "@/src/components/AppShell";
import { requireRole } from "@/src/server/auth";

export default async function ManagerLayout({ children }: LayoutProps<"/manager">) {
  const user = await requireRole("manager");
  return (
    <AppShell role="manager" profile={user.profile}>
      {children}
    </AppShell>
  );
}
