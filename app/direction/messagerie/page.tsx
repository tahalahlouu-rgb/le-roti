import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { PageHeader, Badge, EmptyState } from "@/components/ui";
import { Icon } from "@/components/icons";

interface ConversationRow {
  id: string;
  subject: string;
  last_message_at: string;
  parent: { first_name: string; last_name: string } | null;
}

export default async function DirectionMessagingPage() {
  const profile = await requireRole("admin");
  const supabase = await createClient();

  const [{ data: conversationsData }, { data: unreadData }] = await Promise.all(
    [
      supabase
        .from("conversations")
        .select(
          "id, subject, last_message_at, parent:profiles(first_name, last_name)"
        )
        .order("last_message_at", { ascending: false }),
      supabase
        .from("messages")
        .select("conversation_id")
        .is("read_at", null)
        .neq("sender_id", profile.id),
    ]
  );
  const conversations = (conversationsData ?? []) as unknown as ConversationRow[];
  const unreadSet = new Set((unreadData ?? []).map((m) => m.conversation_id));

  return (
    <>
      <PageHeader title={t.messaging.title} />
      {conversations.length === 0 ? (
        <EmptyState message={t.messaging.noConversations} />
      ) : (
        <ul className="card max-w-3xl divide-y divide-slate-100">
          {conversations.map((c) => (
            <li key={c.id}>
              <Link
                href={`/direction/messagerie/${c.id}`}
                className="flex items-center justify-between gap-2 px-4 py-3 hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">
                    {c.subject}
                  </p>
                  <p className="text-xs text-slate-500">
                    {c.parent
                      ? `${c.parent.first_name} ${c.parent.last_name}`
                      : "—"}{" "}
                    · {formatDate(c.last_message_at)}
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
