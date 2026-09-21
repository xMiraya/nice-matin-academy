import { AppShell } from "@/src/components/AppShell";
import { requireRole } from "@/src/server/auth";

export default async function CommercialLayout({ children }: LayoutProps<"/commercial">) {
  const user = await requireRole("commercial");
  return (
    <AppShell role="commercial" profile={user.profile}>
      {children}
    </AppShell>
  );
}
