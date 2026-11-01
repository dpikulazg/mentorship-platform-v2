import { collection, doc, getDocs, getDoc, setDoc, updateDoc, deleteDoc, query, orderBy, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { sqliteService } from '../lib/sqlite';
import { ModerationItem, ModerationStatus, UserNotification, DataSourceType } from '../types';

export const moderationService = {
  /**
   * Fetch all items in moderation queue with optional status filter
   */
  async getQueue(dataSource: DataSourceType, statusFilter?: ModerationStatus): Promise<ModerationItem[]> {
    if (dataSource === 'sqlite') {
      return sqliteService.getModerationItems(statusFilter);
    }

    try {
      let q = collection(db, 'moderation_queue');
      let snap;
      if (statusFilter) {
        snap = await getDocs(query(q, where('status', '==', statusFilter)));
      } else {
        snap = await getDocs(q);
      }

      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as ModerationItem));
      // Sort newest first
      return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'moderation_queue');
      return [];
    }
  },

  /**
   * Submit new content for mentor moderation
   */
  async submitContent(
    dataSource: DataSourceType,
    submission: {
      userId: string;
      userEmail: string;
      contentType: 'trade' | 'setup' | 'question' | 'resource';
      title: string;
      description?: string;
      payload?: ModerationItem['payload'];
    }
  ): Promise<ModerationItem> {
    const id = `mod-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const item: ModerationItem = {
      id,
      userId: submission.userId,
      userEmail: submission.userEmail,
      contentType: submission.contentType,
      title: submission.title,
      description: submission.description || '',
      status: 'pending',
      flagged: false,
      createdAt: now,
      updatedAt: now,
      payload: submission.payload
    };

    if (dataSource === 'sqlite') {
      await sqliteService.saveModerationItem(item);
    } else {
      try {
        await setDoc(doc(db, 'moderation_queue', id), item);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `moderation_queue/${id}`);
      }
    }

    return item;
  },

  /**
   * Review a submission (Approve or Reject with feedback) and notify the user
   */
  async reviewSubmission(
    dataSource: DataSourceType,
    params: {
      id: string;
      userId: string;
      userEmail: string;
      status: ModerationStatus;
      rejectionReason?: string;
      reviewerNotes?: string;
      reviewerId: string;
      reviewerEmail: string;
      contentTitle: string;
    }
  ): Promise<void> {
    const reviewedAt = new Date().toISOString();

    // 1. Update moderation item record
    if (dataSource === 'sqlite') {
      await sqliteService.reviewModerationItem(
        params.id,
        params.status,
        params.rejectionReason,
        params.reviewerNotes,
        params.reviewerId,
        params.reviewerEmail
      );
    } else {
      try {
        await updateDoc(doc(db, 'moderation_queue', params.id), {
          status: params.status,
          rejectionReason: params.rejectionReason || null,
          reviewerNotes: params.reviewerNotes || null,
          reviewerId: params.reviewerId,
          reviewerEmail: params.reviewerEmail,
          reviewedAt,
          updatedAt: reviewedAt
        });

        // Also if user has a corresponding trade in users/{userId}/trades/{id}, update it
        try {
          const tradeRef = doc(db, 'users', params.userId, 'trades', params.id);
          const tradeDoc = await getDoc(tradeRef);
          if (tradeDoc.exists()) {
            await updateDoc(tradeRef, {
              status: params.status === 'approved' ? 'approved' : params.status === 'rejected' ? 'rejected' : 'under_review',
              mentorFeedback: params.reviewerNotes || (params.status === 'approved' ? 'Approved by Mentor' : params.rejectionReason),
              rejectionReason: params.rejectionReason || null,
              updatedAt: reviewedAt
            });
          }
        } catch (e) {
          // Non-blocking if trade does not exist under that exact id
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `moderation_queue/${params.id}`);
      }
    }

    // 2. Transmit In-App User Notification
    const notifId = `notif-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    let notifTitle = '';
    let notifMessage = '';
    let notifType: 'approved' | 'rejected' | 'info' | 'warning' = 'info';

    if (params.status === 'approved') {
      notifTitle = `Trade Setup Odobren: ${params.contentTitle}`;
      notifMessage = `Mentor (${params.reviewerEmail}) je odobrio vaš rad.${params.reviewerNotes ? ` Komentar mentora: "${params.reviewerNotes}"` : ' Čestitamo na discipliniranoj egzekuciji!'}`;
      notifType = 'approved';
    } else if (params.status === 'rejected') {
      notifTitle = `Revizija Odbijena: ${params.contentTitle}`;
      notifMessage = `Prijava je odbijena. Razlog: ${params.rejectionReason || 'Ne zadovoljava uvjete'}.${params.reviewerNotes ? ` Smjernice mentora: "${params.reviewerNotes}"` : ''}`;
      notifType = 'rejected';
    } else if (params.status === 'under_review') {
      notifTitle = `Evaluacija u Tijeku: ${params.contentTitle}`;
      notifMessage = `Mentor (${params.reviewerEmail}) trenutno analizira vaš setup. Uskoro stiže detaljna povratna informacija.`;
      notifType = 'info';
    }

    const notification: UserNotification = {
      id: notifId,
      userId: params.userId,
      title: notifTitle,
      message: notifMessage,
      type: notifType,
      read: false,
      relatedSubmissionId: params.id,
      createdAt: reviewedAt
    };

    if (dataSource === 'sqlite') {
      await sqliteService.addNotification(notification);
    } else {
      try {
        await setDoc(doc(db, 'users', params.userId, 'notifications', notifId), notification);
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${params.userId}/notifications/${notifId}`);
      }
    }
  },

  /**
   * Toggle flagged status
   */
  async toggleFlag(dataSource: DataSourceType, id: string, currentFlag: boolean): Promise<void> {
    if (dataSource === 'sqlite') {
      await sqliteService.toggleFlagModerationItem(id, !currentFlag);
    } else {
      try {
        await updateDoc(doc(db, 'moderation_queue', id), {
          flagged: !currentFlag,
          updatedAt: new Date().toISOString()
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `moderation_queue/${id}`);
      }
    }
  },

  /**
   * Delete submission
   */
  async deleteItem(dataSource: DataSourceType, id: string): Promise<void> {
    if (dataSource === 'sqlite') {
      await sqliteService.deleteModerationItem(id);
    } else {
      try {
        await deleteDoc(doc(db, 'moderation_queue', id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `moderation_queue/${id}`);
      }
    }
  },

  /**
   * Fetch User Notifications
   */
  async getUserNotifications(dataSource: DataSourceType, userId: string): Promise<UserNotification[]> {
    if (dataSource === 'sqlite') {
      return sqliteService.getUserNotifications(userId);
    }

    try {
      const snap = await getDocs(collection(db, 'users', userId, 'notifications'));
      const notifs = snap.docs.map(d => ({ id: d.id, ...d.data() } as UserNotification));
      return notifs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, `users/${userId}/notifications`);
      return [];
    }
  },

  /**
   * Mark notification as read
   */
  async markNotificationRead(dataSource: DataSourceType, userId: string, notifId: string): Promise<void> {
    if (dataSource === 'sqlite') {
      await sqliteService.markNotificationAsRead(notifId);
    } else {
      try {
        await updateDoc(doc(db, 'users', userId, 'notifications', notifId), { read: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/notifications/${notifId}`);
      }
    }
  },

  /**
   * Mark all notifications as read for a user
   */
  async markAllNotificationsRead(dataSource: DataSourceType, userId: string): Promise<void> {
    if (dataSource === 'sqlite') {
      await sqliteService.markAllNotificationsAsRead(userId);
    } else {
      try {
        const snap = await getDocs(collection(db, 'users', userId, 'notifications'));
        const updates = snap.docs.map(d => updateDoc(doc(db, 'users', userId, 'notifications', d.id), { read: true }));
        await Promise.all(updates);
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `users/${userId}/notifications`);
      }
    }
  }
};
