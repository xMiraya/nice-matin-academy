import type { Metadata } from "next";
import { NotificationsScreen } from "@/app/commercial/notifications/NotificationsScreen";

export const metadata: Metadata = {
  title: "Notifications",
  description: "Retours de votre manager sur vos simulations.",
};

export default function CommercialNotificationsPage() {
  return <NotificationsScreen />;
}
