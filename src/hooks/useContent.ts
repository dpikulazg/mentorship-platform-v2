import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { ContentItem } from '../types';

export function useContent() {
  const [content, setContent] = useState<Record<string, ContentItem>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'content'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const newContent: Record<string, ContentItem> = {};
      snapshot.forEach((doc) => {
        newContent[doc.data().key] = { id: doc.id, ...doc.data() } as ContentItem;
      });
      setContent(newContent);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'content');
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { content, loading };
}
