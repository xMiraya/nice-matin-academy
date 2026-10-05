import "server-only";
import { getDb } from "@/src/server/db";

/** Rattache une conversation Tavus à l'utilisateur qui l'a lancée. */
export async function recordConversation(userId: string, simulationId: string, conversationId: string) {
  const db = await getDb();
  await db.query(
    `INSERT INTO tavus_conversations (conversation_id,user_id,simulation_id) VALUES ($1,$2,$3)
     ON CONFLICT DO NOTHING`,
    [conversationId, userId, simulationId],
  );
}

/** Vrai seulement si cette conversation a été créée par cet utilisateur. */
export async function isConversationOwner(userId: string, conversationId: string): Promise<boolean> {
  const db = await getDb();
  const { rows } = await db.query("SELECT 1 FROM tavus_conversations WHERE conversation_id = $1 AND user_id = $2", [
    conversationId,
    userId,
  ]);
  return rows.length > 0;
}
