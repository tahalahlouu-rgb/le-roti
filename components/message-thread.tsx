import { t } from "@/lib/i18n";
import { formatDate } from "@/lib/format";
import { sendMessage } from "@/lib/actions/communication";
import { ActionForm, SubmitButton } from "@/components/forms";
import type { Message } from "@/lib/types";

const timeFormat = new Intl.DateTimeFormat("fr-MA", {
  hour: "2-digit",
  minute: "2-digit",
});

// Fil de discussion partagé (parent et direction) : bulles + réponse
export function MessageThread({
  messages,
  viewerId,
  conversationId,
}: {
  messages: Message[];
  viewerId: string;
  conversationId: string;
}) {
  return (
    <>
      <div className="space-y-3">
        {messages.map((message) => {
          const mine = message.sender_id === viewerId;
          return (
            <div
              key={message.id}
              className={`flex ${mine ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                  mine
                    ? "rounded-br-sm bg-emerald-700 text-white"
                    : "rounded-bl-sm border border-slate-200 bg-white text-slate-800"
                }`}
              >
                <p className="whitespace-pre-wrap">{message.body}</p>
                <p
                  className={`mt-1 text-right text-[11px] ${
                    mine ? "text-emerald-100" : "text-slate-400"
                  }`}
                >
                  {formatDate(message.created_at)} ·{" "}
                  {timeFormat.format(new Date(message.created_at))}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <ActionForm action={sendMessage} className="mt-4 flex items-end gap-2">
        <input type="hidden" name="conversation_id" value={conversationId} />
        <textarea
          name="body"
          required
          rows={2}
          placeholder={t.messaging.placeholder}
          className="input flex-1 resize-none"
        />
        <SubmitButton>{t.messaging.send}</SubmitButton>
      </ActionForm>
    </>
  );
}
