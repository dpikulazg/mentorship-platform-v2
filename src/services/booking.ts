import { doc, collection, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { UserProfile, Booking, CreditLedgerEntry } from '../types';

export const requestBooking = async (
  userId: string, 
  userProfile: UserProfile, 
  scheduledAt: Date
) => {
  // Check conditions before running transaction (optimistic)
  if (!userProfile.availableCredits || userProfile.availableCredits <= 0) {
    throw new Error('No available credits.');
  }

  if (userProfile.serviceAccessExpiresAt) {
    const expiresAt = new Date(userProfile.serviceAccessExpiresAt);
    if (expiresAt < new Date()) {
      throw new Error('Service access window has expired.');
    }
  }

  // Run transaction to ensure we have available credits without race condition
  await runTransaction(db, async (transaction) => {
    const userRef = doc(db, 'users', userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      throw new Error('User does not exist.');
    }

    const currentProfile = userDoc.data() as UserProfile;

    if (!currentProfile.availableCredits || currentProfile.availableCredits <= 0) {
      throw new Error('No available credits.');
    }

    if (currentProfile.serviceAccessExpiresAt) {
      const expiresAt = new Date(currentProfile.serviceAccessExpiresAt);
      if (expiresAt < new Date()) {
        throw new Error('Service access window has expired.');
      }
    }

    // 1. Create a booking document
    const newBookingRef = doc(collection(db, 'bookings'));
    const bookingData: Partial<Booking> = {
      id: newBookingRef.id,
      userId,
      status: 'pending',
      scheduledAt: scheduledAt.toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    // 2. Create a held ledger entry
    const newLedgerRef = doc(collection(db, 'users', userId, 'credit_ledger'));
    const ledgerData: Partial<CreditLedgerEntry> = {
      id: newLedgerRef.id,
      userId,
      type: 'held',
      amount: 1,
      relatedEntityId: newBookingRef.id,
      notes: 'Booking requested',
      createdAt: new Date().toISOString(),
    };

    // 3. Update the user's available credits (-1)
    const newCredits = currentProfile.availableCredits - 1;

    // Apply all mutations
    transaction.set(newBookingRef, bookingData);
    transaction.set(newLedgerRef, ledgerData);
    transaction.update(userRef, { availableCredits: newCredits });
  });
};

export const cancelBooking = async (
  userId: string,
  bookingId: string
) => {
  // A cancellation should release the held credit. We assume this is done within timeframe.
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await transaction.get(bookingRef);

    if (!bookingDoc.exists()) {
      throw new Error('Booking does not exist.');
    }

    const booking = bookingDoc.data() as Booking;

    if (booking.userId !== userId) {
      throw new Error('Unauthorized');
    }

    // if already cancelled or completed, we cannot release again easily
    if (booking.status !== 'pending' && booking.status !== 'confirmed') {
      throw new Error('Booking cannot be cancelled from its current state.');
    }

    const userRef = doc(db, 'users', userId);
    const userDoc = await transaction.get(userRef);

    if (!userDoc.exists()) {
      throw new Error('User does not exist.');
    }

    const currentProfile = userDoc.data() as UserProfile;

    // 1. Update booking status
    transaction.update(bookingRef, {
      status: 'cancelled',
      updatedAt: new Date().toISOString(),
    });

    // 2. Create release ledger entry
    const newLedgerRef = doc(collection(db, 'users', userId, 'credit_ledger'));
    const ledgerData: Partial<CreditLedgerEntry> = {
      id: newLedgerRef.id,
      userId,
      type: 'released',
      amount: 1,
      relatedEntityId: bookingId,
      notes: 'Booking cancelled within rules',
      createdAt: new Date().toISOString(),
    };

    // 3. Update user credits (+1)
    const newCredits = (currentProfile.availableCredits || 0) + 1;
    transaction.set(newLedgerRef, ledgerData);
    transaction.update(userRef, { availableCredits: newCredits });
  });
};

export const consumeBooking = async (userId: string, bookingId: string) => {
  // Consume credit after the call is finished or no-show. Handled by admin typically.
  await runTransaction(db, async (transaction) => {
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await transaction.get(bookingRef);

    if (!bookingDoc.exists()) {
      throw new Error('Booking does not exist.');
    }

    const booking = bookingDoc.data() as Booking;

    if (booking.status !== 'confirmed') {
      throw new Error('Can only consume a confirmed booking.');
    }

    transaction.update(bookingRef, {
      status: 'completed',
      updatedAt: new Date().toISOString(),
    });

    const newLedgerRef = doc(collection(db, 'users', userId, 'credit_ledger'));
    const ledgerData: Partial<CreditLedgerEntry> = {
      id: newLedgerRef.id,
      userId,
      type: 'consumed',
      amount: 1,
      relatedEntityId: bookingId,
      notes: 'Booking session completed',
      createdAt: new Date().toISOString(),
    };

    // Note: The credit was already decremented from availableCredits during the Hold phase.
    // So we don't adjust availableCredits again. We just log the consumption.
    transaction.set(newLedgerRef, ledgerData);
  });
};
