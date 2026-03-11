"use client";

import { Bell, MessageCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { Dropdown } from "@/components/ui/Dropdown";
import { useNotifications } from "@/lib/notifications/NotificationsProvider";

type Props = {
  className?: string;
};

export default function NotificationBell({ className = "" }: Props) {
  const router = useRouter();
  const { hasUnread, notifications, clearAll } = useNotifications();

  const hasItems = notifications.length > 0;

  return (
    <Dropdown className={className}>
      <Dropdown.Trigger>
        <button
          type="button"
          className="hover:bg-muted relative flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          aria-label={hasUnread ? "Notifications non lues" : "Notifications"}
        >
          <Bell className="text-muted-foreground h-5 w-5" />
          {hasUnread && (
            <span
              className="border-background absolute -top-0.5 -right-0.5 h-3 w-3 animate-pulse rounded-full border-2 bg-blue-500 ring-2 ring-blue-500/30"
              aria-hidden
            />
          )}
        </button>
      </Dropdown.Trigger>
      <Dropdown.Menu position="bottom" align="right">
        <div className="border-border text-muted-foreground border-b px-3 py-2 text-xs font-semibold tracking-wide uppercase">
          Notifications
        </div>
        {!hasItems && (
          <div className="text-muted-foreground px-3 py-3 text-sm">
            Aucune notification récente
          </div>
        )}
        {hasItems && (
          <ul className="max-h-80 w-72 overflow-y-auto text-sm">
            {notifications.map((n) => (
              <li key={n.id}>
                <button
                  type="button"
                  className="hover:bg-muted flex w-full items-start gap-2 px-3 py-2 text-left"
                  role="menuitem"
                  onClick={() => {
                    if (n.href) {
                      router.push(n.href);
                    }
                    clearAll();
                  }}
                >
                  <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="text-foreground font-medium">
                      {n.title}
                    </span>
                    <span className="text-muted-foreground line-clamp-2 text-xs">
                      {n.body}
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
        {hasItems && (
          <button
            type="button"
            className="hover:bg-muted text-muted-foreground mt-1 block w-full px-3 py-2 text-left text-xs"
            role="menuitem"
            onClick={() => clearAll()}
          >
            Tout marquer comme lu
          </button>
        )}
      </Dropdown.Menu>
    </Dropdown>
  );
}
