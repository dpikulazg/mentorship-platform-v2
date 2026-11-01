export type UserRole = 'admin' | 'user' | 'mentor';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  languagePreference: 'en' | 'hr';
  createdAt: string;
  plan?: 'starter' | 'pro' | 'mentorship';
  tierValue?: number; // 1 = Starter, 2 = Pro, 3 = Mentorship
  serviceAccessExpiresAt?: string; // Vremenski prozor usluga
  availableCredits?: number; // Materijalizirani prikaz (snapshot)
  status?: 'pending' | 'active';
  photoUrl?: string;
}

export interface ContentItem {
  id: string;
  key: string;
  en: string;
  hr: string;
  type: 'text' | 'html' | 'image';
  lastUpdated: string;
  updatedBy: string;
}

export interface AppSettings {
  monetizationEnabled: boolean;
  subscriptionPrice: number;
  currency: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  order: number;
  createdAt: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  title: string;
  description: string;
  videoUrl: string;
  duration: string;
  order: number;
  createdAt: string;
  videoType?: 'url' | 'upload';
  videoFileName?: string;
  videoFileSize?: number;
  videoBlobId?: string;
  isUploaded?: boolean;
}

export type DataSourceType = 'sqlite' | 'firestore';

export interface Affiliate {
  id: string;
  userId?: string;
  userName: string;
  userEmail: string;
  affiliateCode: string;
  commissionRate: number; // e.g. 20 for 20%
  totalEarnings: number;
  unpaidBalance: number;
  totalReferrals: number;
  status: 'active' | 'pending' | 'suspended';
  payoutMethod: 'crypto_usdt' | 'bank_iban' | 'revolut' | 'paypal';
  payoutDetails: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AffiliateReferral {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  referredUserEmail: string;
  plan: 'starter' | 'pro' | 'mentorship';
  saleAmount: number;
  commissionAmount: number;
  status: 'pending' | 'approved' | 'paid';
  createdAt: string;
}

export interface AffiliatePayout {
  id: string;
  affiliateId: string;
  affiliateCode: string;
  amount: number;
  payoutMethod: string;
  payoutDetails: string;
  referenceId?: string;
  status: 'processing' | 'completed' | 'rejected';
  createdAt: string;
  completedAt?: string;
}

export interface Product {
  id: string;
  name: string;
  type: 'subscription' | 'one_time';
  price: number;
  description: string;
  features: string[];
  grantedTierValue?: number;
  serviceDurationMonths?: number;
  grantedCredits?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type CreditEventType = 'granted' | 'held' | 'released' | 'consumed' | 'expired';

export interface CreditLedgerEntry {
  id: string;
  userId: string;
  type: CreditEventType;
  amount: number;
  relatedEntityId?: string; // TransactionId or BookingId
  notes?: string;
  createdAt: string;
}

export interface Booking {
  id: string;
  userId: string;
  mentorId?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: string;
  userId: string;
  productId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: string;
}

export type ModerationStatus = 'pending' | 'under_review' | 'approved' | 'rejected';
export type ModerationContentType = 'trade' | 'setup' | 'question' | 'resource';

export interface ModerationItem {
  id: string;
  userId: string;
  userEmail: string;
  contentType: ModerationContentType;
  title: string;
  description?: string;
  status: ModerationStatus;
  flagged?: boolean;
  rejectionReason?: string;
  reviewerNotes?: string;
  reviewerId?: string;
  reviewerEmail?: string;
  reviewedAt?: string;
  createdAt: string;
  updatedAt: string;
  payload?: {
    pair?: string;
    orderEntry?: number;
    orderExit?: number;
    stopLoss?: number;
    takeProfit?: number;
    riskRewardRatio?: number;
    pnl?: number;
    chartUrl?: string;
    emotion?: string;
    exchange?: string;
    timeframe?: string;
  };
}

export interface UserNotification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'approved' | 'rejected' | 'info' | 'warning';
  read: boolean;
  relatedSubmissionId?: string;
  createdAt: string;
}

export interface TradeSubmission {
  id: string;
  userId: string;
  pair: string;
  orderEntry?: number;
  orderExit?: number;
  pnl?: number;
  notes?: string;
  status: 'pending' | 'under_review' | 'approved' | 'reviewed' | 'rejected';
  mentorFeedback?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

