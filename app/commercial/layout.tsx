import { AppShell } from "@/src/components/AppShell";
import { DEMO_COMMERCIAL_PROFILE } from "@/src/data/demo-commercial";

export default function CommercialLayout({ children }: LayoutProps<"/commercial">) {
  return (
    <AppShell role="commercial" profile={DEMO_COMMERCIAL_PROFILE}>
      {children}
    </AppShell>
  );
}
