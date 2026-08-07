import { AppShell } from "@/src/components/AppShell";
import { DEMO_MANAGER_PROFILE } from "@/src/data/demo-manager";

export default function ManagerLayout({ children }: LayoutProps<"/manager">) {
  return (
    <AppShell role="manager" profile={DEMO_MANAGER_PROFILE}>
      {children}
    </AppShell>
  );
}
