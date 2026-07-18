import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { Badge, EmptyState } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/forms";
import { startConversation } from "@/lib/actions/communication";
import { Icon } from "@/components/icons";
import type { Conversation } from "@/lib/types";

export default async function ParentMessagingPage() {
  const profile = await requireRole("parent");
  const supabase = await createClient();

  const [{ data: conversationsData }, { data: unreadData }] = await Promise.all(
    [
      supabase
        .from("conversations")
        .select("*")
        .order("last_message_at", { ascending: false }),
      supabase
        .from("messages")
        .select("conversation_id")
        .is("read_at", null)
        .neq("sender_id", profile.id),
    ]
  );
  const conversations = (conversationsData ?? []) as Conversation[];
  const unreadSet = new Set((unreadData ?? []).map((m) => m.conversation_id));

  return (
    <>
      <h1 className="mb-4 text-lg font-semibold text-slate-900">
        {t.messaging.title}
      </h1>

      {/* Nouveau fil */}
      <details className="card mb-4">
        <summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium text-emerald-700">
          <Icon name="plus" className="h-4 w-4" />
          {t.messaging.newConversation}
        </summary>
        <div className="border-t border-slate-100 p-4">
          <ActionForm action={startConversation}>
            <input
              name="subject"
              required
              placeholder={t.messaging.subject}
              className="input mb-3"
            />
            <textarea
              name="body"
              required
              rows={3}
              placeholder={t.messaging.placeholder}
              className="input mb-3"
            />
            <SubmitButton>{t.messaging.send}</SubmitButton>
          </ActionForm>
        </div>
      </details>

      {conversations.length === 0 ? (
        <EmptyState message={t.messaging.noConversations} />
      ) : (
        <ul className="card divide-y divide-slate-100">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/parent/messagerie/${c.id}`}
                className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {c.subject}
                  </p>
                  <p className="text-xs text-slate-500">
                    {formatDate(c.last_message_at)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {unreadSet.has(c.id) && (
                    <Badge tone="green">{t.messaging.unread}</Badge>
                  )}
                  <Icon
                    name="chevronRight"
                    className="h-4 w-4 text-slate-300"
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
