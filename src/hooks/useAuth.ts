import { useState, useEffect } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../lib/firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile } from '../types';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const isAdminEmail = (email: string | null) => 
    email === 'dado.zaprudje@gmail.com' || 
    email === 'zagreb.dado.piksi@gmail.com';

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
          } else {
            // Create default profile if not exists
            const newProfile: UserProfile = {
              uid: firebaseUser.uid,
              email: firebaseUser.email || '',
              role: isAdminEmail(firebaseUser.email) ? 'admin' : 'user',
              languagePreference: 'en',
              createdAt: new Date().toISOString(),
              plan: 'starter', // Default plan
              status: firebaseUser.emailVerified ? 'active' : 'pending',
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (err) {
          handleFirestoreError(err, OperationType.GET, `users/${firebaseUser.uid}`);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { 
    user, 
    profile, 
    loading, 
    isAdmin: profile?.role === 'admin' || isAdminEmail(user?.email || null),
    isMentor: profile?.role === 'mentor',
    isVerified: user?.emailVerified || false
  };
}
