import React, { useState, useEffect, useRef } from 'react';
import { Bell, Check, CheckCheck, X, CheckCircle2, AlertTriangle, Info, Clock } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { useDataSource } from '../hooks/useDataSource';
import { moderationService } from '../services/moderation';
import { subscribeToSqlite } from '../lib/sqlite';
import { UserNotification } from '../types';
import { collection, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';

export function NotificationBell() {
  const { user } = useAuth();
  const { dataSource } = useDataSource();

  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const loadNotifications = async () => {
    if (!user) return;
    try {
      const notifs = await moderationService.getUserNotifications(dataSource, user.uid);
      setNotifications(notifs);
    } catch (err) {
      console.warn('Failed to load user notifications:', err);
    }
  };

  useEffect(() => {
    if (!user) return;

    if (dataSource === 'sqlite') {
      loadNotifications();
      const unsub = subscribeToSqlite(() => {
        loadNotifications();
      });
      return () => unsub();
    } else {
      // Realtime listener for Firestore
      const notifsRef = collection(db, 'users', user.uid, 'notifications');
      const unsub = onSnapshot(notifsRef, (snap) => {
        const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserNotification));
        notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        setNotifications(notifs);
      }, (err) => {
        handleFirestoreError(err, OperationType.LIST, `users/${user.uid}/notifications`);
      });
      return () => unsub();
    }
  }, [user, dataSource]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = async (notifId: string) => {
    if (!user) return;
    try {
      await moderationService.markNotificationRead(dataSource, user.uid, notifId);
      setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllAsRead = async () => {
    if (!user) return;
    try {
      await moderationService.markAllNotificationsRead(dataSource, user.uid);
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  if (!user) return null;

  return (
    <div className="relative font-mono" ref={dropdownRef}>
      {/* Bell Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle notifications menu"
        className={`relative p-2 rounded-none transition-all border ${
          unreadCount > 0 
            ? 'border-primary/40 bg-primary/10 text-primary hover:bg-primary/20' 
            : 'border-white/10 text-foreground/50 hover:text-white hover:border-white/20'
        }`}
      >
        <Bell className="w-4 h-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center bg-primary text-black font-black text-[9px] rounded-full shadow-[0_0_8px_rgba(175,70,255,0.8)] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-[#09090d] border border-primary/30 shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 overflow-hidden">
          {/* Header */}
          <div className="p-3 border-b border-primary/20 bg-primary/5 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-white">
                Dispatch Notifications
              </span>
              {unreadCount > 0 && (
                <span className="px-1.5 py-0.2 bg-primary text-black text-[9px] font-black uppercase">
                  {unreadCount} New
                </span>
              )}
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-[9px] text-primary/70 hover:text-primary uppercase tracking-wider flex items-center gap-1 transition-colors"
              >
                <CheckCheck className="w-3 h-3" />
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-96 overflow-y-auto divide-y divide-white/5">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-zinc-500 text-xs">
                No notifications logged. Submissions will reflect review status here.
              </div>
            ) : (
              notifications.map((notif) => {
                const isApproved = notif.type === 'approved';
                const isRejected = notif.type === 'rejected';

                return (
                  <div
                    key={notif.id}
                    onClick={() => handleMarkAsRead(notif.id)}
                    className={`p-3.5 transition-colors cursor-pointer relative group ${
                      !notif.read ? 'bg-primary/5 hover:bg-primary/10' : 'hover:bg-white/5'
                    }`}
                  >
                    {!notif.read && (
                      <div className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-primary" />
                    )}
                    <div className="pl-2">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="flex items-center gap-1.5">
                          {isApproved && (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />
                          )}
                          {isRejected && (
                            <AlertTriangle className="w-3.5 h-3.5 text-red-400 shrink-0" />
                          )}
                          {!isApproved && !isRejected && (
                            <Info className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                          )}
                          <span className={`text-[11px] font-bold ${
                            isApproved ? 'text-green-400' : isRejected ? 'text-red-400' : 'text-white'
                          }`}>
                            {notif.title}
                          </span>
                        </div>
                        <span className="text-[9px] text-zinc-500 whitespace-nowrap">
                          {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <p className="text-[11px] text-zinc-300 leading-relaxed font-sans pl-5">
                        {notif.message}
                      </p>

                      <div className="mt-1.5 flex justify-between items-center text-[9px] text-zinc-500 pl-5">
                        <span>{new Date(notif.createdAt).toLocaleDateString()}</span>
                        {!notif.read && (
                          <span className="text-primary text-[9px] uppercase tracking-wider font-bold">
                            Unread
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-primary/20 bg-black/60 text-center">
            <span className="text-[9px] text-primary/40 uppercase tracking-widest">
              CryptoMentor System Event Stream
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
