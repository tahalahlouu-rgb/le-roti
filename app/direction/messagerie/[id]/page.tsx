import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { MessageThread } from "@/components/message-thread";
import type { Message } from "@/lib/types";

interface ConversationRow {
  id: string;
  subject: string;
  parent: { first_name: string; last_name: string; phone: string | null } | null;
}

export default async function DirectionConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const { data: conversationData } = await supabase
    .from("conversations")
    .select("id, subject, parent:profiles(first_name, last_name, phone)")
    .eq("id", id)
    .single();
  if (!conversationData) notFound();
  const conversation = conversationData as unknown as ConversationRow;

  // Marquer comme lus les messages du parent
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

  return (
    <>
      <Link
        href="/direction/messagerie"
        className="mb-3 inline-block text-sm text-slate-500 hover:text-slate-700"
      >
        ← {t.common.back}
      </Link>
      <h1 className="mb-1 text-lg font-semibold text-slate-900">
        {conversation.subject}
      </h1>
      <p className="mb-4 text-sm text-slate-500">
        {conversation.parent
          ? `${conversation.parent.first_name} ${conversation.parent.last_name}${
              conversation.parent.phone ? ` · ${conversation.parent.phone}` : ""
            }`
          : "—"}
      </p>
      <div className="max-w-3xl">
        <MessageThread
          messages={messages}
          viewerId={profile.id}
          conversationId={id}
        />
      </div>
    </>
  );
}
