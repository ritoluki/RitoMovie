import { Bell, ArrowRight } from 'lucide-react';
export default function NotificationToast({
  title,
  body,
  label,
  onOpen,
}: {
  title: string;
  body: string;
  label: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="flex w-full max-w-sm gap-3 rounded-2xl border border-white/10 bg-[#1b1d24] p-4 text-left text-white shadow-xl transition hover:border-red-400/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
    >
      <span className="mt-0.5 grid size-9 shrink-0 self-start place-items-center rounded-xl bg-red-500/10 text-red-300">
        <Bell className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="mt-1 block text-sm leading-6 text-gray-400">
          {body}
        </span>
        <span className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-red-300">
          {label}
          <ArrowRight className="size-3" />
        </span>
      </span>
    </button>
  );
}
