import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { getNotificationsApi, markNotificationReadApi, type AppNotification } from '../lib/api';
import { Button, buttonVariants } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

const formatRelativeTime = (dateTime: string) => {
  const date = new Date(dateTime);
  if (Number.isNaN(date.getTime())) {
    return 'Just now';
  }

  const diffMs = Date.now() - date.getTime();
  if (diffMs < 60_000) {
    return 'Just now';
  }

  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h ago`;
  }

  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d ago`;
  }

  return date.toLocaleDateString();
};

export function NotificationBell() {
  const { token } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);
  const [markingId, setMarkingId] = useState<string | null>(null);

  const loadNotifications = useCallback(
    async (silent = false) => {
      if (!token) {
        setNotifications([]);
        return;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const rows = await getNotificationsApi(token);
        setNotifications(Array.isArray(rows) ? rows : []);
      } catch (error) {
        if (!silent) {
          const message = error instanceof Error ? error.message : 'Failed to load notifications';
          toast.error(message);
        }
      } finally {
        if (!silent) {
          setLoading(false);
        }
      }
    },
    [token]
  );

  useEffect(() => {
    void loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const timer = globalThis.setInterval(() => {
      void loadNotifications(true);
    }, 30_000);

    return () => {
      globalThis.clearInterval(timer);
    };
  }, [loadNotifications, token]);

  useEffect(() => {
    if (open) {
      void loadNotifications(true);
    }
  }, [open, loadNotifications]);

  const unreadCount = useMemo(
    () => notifications.filter((notification) => !notification.isRead).length,
    [notifications]
  );

  const handleNotificationClick = async (notification: AppNotification) => {
    if (!token || notification.isRead) {
      return;
    }

    try {
      setMarkingId(notification._id);
      await markNotificationReadApi(token, notification._id);

      setNotifications((current) =>
        current.map((item) =>
          item._id === notification._id
            ? {
                ...item,
                isRead: true,
              }
            : item
        )
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update notification';
      toast.error(message);
    } finally {
      setMarkingId(null);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={buttonVariants({
            variant: 'outline',
            size: 'icon',
            className: 'relative',
          })}
          aria-label="Open notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[10px] font-semibold text-white flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>

      <PopoverContent align="end" className="w-[360px] p-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <div>
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-gray-500">{unreadCount} unread</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => void loadNotifications()}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
            Refresh
          </Button>
        </div>

        <div className="max-h-[360px] overflow-y-auto">
          {loading && notifications.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-600 flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading notifications...
            </div>
          )}

          {!loading && notifications.length === 0 && (
            <div className="px-4 py-6 text-sm text-gray-600">No notifications yet.</div>
          )}

          {notifications.map((notification) => {
            const isMarking = markingId === notification._id;

            return (
              <button
                key={notification._id}
                type="button"
                onClick={() => void handleNotificationClick(notification)}
                disabled={isMarking}
                className={`w-full text-left px-4 py-3 border-b border-gray-100 last:border-b-0 transition-colors ${
                  notification.isRead ? 'bg-white hover:bg-gray-50' : 'bg-blue-50/60 hover:bg-blue-100/60'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-gray-900">{notification.title || 'New update'}</p>
                  {isMarking ? (
                    <Loader2 className="w-3.5 h-3.5 mt-0.5 text-gray-400 animate-spin" />
                  ) : (
                    !notification.isRead && <span className="h-2.5 w-2.5 mt-1 rounded-full bg-blue-500" />
                  )}
                </div>
                <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                  {notification.message || 'You have a new notification.'}
                </p>
                <p className="mt-1 text-[11px] text-gray-400">{formatRelativeTime(notification.createdAt)}</p>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
