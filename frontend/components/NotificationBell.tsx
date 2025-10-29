import React, { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import Button from './ui/Button';
import Card from './ui/Card';
import api from '../utils/api';

const NotificationBell = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const notificationRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const data = await api.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      }
    };

    fetchNotifications();
  }, []);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target as any)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  return (
    <div className="relative" ref={notificationRef}>
      <Button onClick={() => setIsOpen(!isOpen)} aria-label="Open notifications" title="Notifications">
        <Bell size={16} />
        {notifications.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full shadow-premium">
            {notifications.length}
          </span>
        )}
      </Button>
      {isOpen && (
        <div className="absolute right-0 mt-2 min-w-[300px] glass shadow-premium rounded-xl border border-white/10 p-3 z-50">
          <div className="text-lg font-bold mb-2">Notifications</div>
          {notifications.length > 0 ? (
            notifications.map((notif) => {
              let message = '';
              switch (notif.type) {
                case 'like':
                  message = `User ${notif.fromUserId} liked your post`;
                  break;
                case 'repost':
                  message = `User ${notif.fromUserId} reposted your post`;
                  break;
                case 'reply':
                  message = `User ${notif.fromUserId} replied to your post`;
                  break;
                default:
                  message = 'New notification';
              }
              return (
                <Card key={notif._id} className="p-2 mb-2">
                  <div className="text-sm">{message}</div>
                  <div className="text-xs text-gray-400">{new Date(notif.createdAt).toLocaleString()}</div>
                </Card>
              );
            })
          ) : (
            <div className="text-center text-gray-400">No new notifications</div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
