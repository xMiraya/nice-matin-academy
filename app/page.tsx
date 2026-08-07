import { redirect } from "next/navigation";

/** La racine renvoie vers la page de connexion. */
export default function Home() {
  redirect("/connexion");
}
