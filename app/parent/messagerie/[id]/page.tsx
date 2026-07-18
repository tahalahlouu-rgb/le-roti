import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { MessageThread } from "@/components/message-thread";
import type { Conversation, Message } from "@/lib/types";

export default async function ParentConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole("parent");
  const supabase = await createClient();

  const { data: conversation } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .single();
  if (!conversation) notFound();

  // Marquer comme lus les messages de la direction
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", id)
    .is("read_at", null)
    .neq("sender_id", profile.id);

  const { data: messagesData } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at");
  const messages = (messagesData ?? []) as Message[];
  const c = conversation as Conversation;

  return (
    <>
      <Link
        href="/parent/messagerie"
        className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">{c.subject}</h1>
      <p className="mb-4 text-sm text-slate-500">
        {t.messaging.withDirection}
      </p>
      <MessageThread
        messages={messages}
        viewerId={profile.id}
        conversationId={id}
      />
    </>
  );
}
