import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from './firebase';

export interface PaymentData {
  id: string;
  amount: number;
  created_at: any;
  payment_id: string;
  payment_method: string;
  payment_screenshot_url?: string;
  plan_name: string;
  remarks?: string;
  status: 'pending' | 'verified' | 'rejected';
  updated_at: any;
  user_email: string;
  user_id: string;
  utr_number?: string;
  verified_by?: string;
  verified_at?: any;
}

export interface UserPlan {
  id: string;
  userId: string;
  userEmail: string;
  userName?: string;
  planName: string;
  amount: string;
  paymentId: string;
  status: 'active' | 'expired' | 'cancelled';
  startDate: any;
  expiryDate: any;
  createdAt: any;
  updatedAt: any;
  // Payment information
  paymentMethod?: string;
  utrNumber?: string;
  paymentScreenshotUrl?: string;
  remarks?: string;
  verifiedBy?: string;
  verifiedAt?: any;
}

// Check if payment already exists in user plans (by payment_id + amount)
export const checkPaymentExistsInUserPlans = async (paymentId: string, amount: number): Promise<boolean> => {
  try {
    const q = query(
      collection(db, 'userPlans'),
      where('paymentId', '==', paymentId),
      where('amount', '==', amount.toString())
    );
    
    const querySnapshot = await getDocs(q);
    const exists = !querySnapshot.empty;
    
    return exists;
  } catch (error) {
    return false;
  }
};

// Get all user plans to check which payments exist
export const getAllUserPlans = async () => {
  try {
    const q = query(
      collection(db, 'userPlans'),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const userPlans: any[] = [];
    
    querySnapshot.forEach((doc) => {
      userPlans.push({ id: doc.id, ...doc.data() });
    });
    
    return userPlans;
  } catch (error) {
    return [];
  }
};

// Add a single payment to user plans
export const addPaymentToUserPlans = async (paymentData: PaymentData) => {
  try {
    // Check if payment already exists
    const exists = await checkPaymentExistsInUserPlans(paymentData.payment_id, paymentData.amount);
    if (exists) {
      return { success: false, error: 'Payment already exists in user plans' };
    }
    // Calculate expiry date based on plan
    const now = new Date();
    let expiryDate = new Date();
    
    // Check plan name for explicit period indicators
    if (paymentData.plan_name.toLowerCase().includes('monthly')) {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (paymentData.plan_name.toLowerCase().includes('yearly') || paymentData.plan_name.toLowerCase().includes('year')) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else if (paymentData.plan_name.toLowerCase().includes('premium')) {
      // For Premium plans, determine period based on amount
      const amount = paymentData.amount;
      if (amount === 449) {
        // Monthly Premium plan
        expiryDate.setMonth(expiryDate.getMonth() + 1);
      } else if (amount === 4308) {
        // Yearly Premium plan
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      } else {
        // Default to 1 year for other Premium amounts
        expiryDate.setFullYear(expiryDate.getFullYear() + 1);
      }
    } else if (paymentData.plan_name.toLowerCase().includes('ai fundamentals') || paymentData.plan_name.toLowerCase().includes('genai')) {
      // AI Fundamentals course or GenAI course - 1 year access
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      // Default to 1 year for other plans
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    // Create user plan
    const userPlanData = {
      userId: paymentData.user_id,
      userEmail: paymentData.user_email,
      planName: paymentData.plan_name,
      status: 'active', // Always set to active when adding to user plans
      startDate: now, // Set start date to now when adding to user plans
      expiryDate: expiryDate,
      paymentId: paymentData.payment_id,
      amount: paymentData.amount.toString(),
      // Payment information
      paymentMethod: paymentData.payment_method,
      utrNumber: paymentData.utr_number,
      paymentScreenshotUrl: paymentData.payment_screenshot_url,
      remarks: paymentData.remarks,
      verifiedBy: paymentData.verified_by,
      verifiedAt: paymentData.verified_at,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const docRef = await addDoc(collection(db, 'userPlans'), userPlanData);
    return { success: true, id: docRef.id };
    
  } catch (error) {
    return { success: false, error: error };
  }
};

// Get all user plans (success payments only)
export const getUserPlans = async (): Promise<UserPlan[]> => {
  try {
    const q = query(
      collection(db, 'userPlans'), 
      where('status', '==', 'active'),
      orderBy('createdAt', 'desc')
    );
    const querySnapshot = await getDocs(q);
    const userPlans: UserPlan[] = [];
    
    querySnapshot.forEach((doc) => {
      userPlans.push({
        id: doc.id,
        ...doc.data()
      } as UserPlan);
    });
    
    return userPlans;
  } catch (error) {
    return [];
  }
};

// Verify payment
export const verifyPayment = async (planId: string, planName: string, amount: string) => {
  try {
    // This function can be implemented based on your verification logic
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// Update plan
export const updatePlan = async (planId: string, updates: Partial<UserPlan>) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const planRef = doc(db, 'userPlans', planId);
    await updateDoc(planRef, {
      ...updates,
      updatedAt: serverTimestamp()
    });
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};

// Check if plan is expired
export const isPlanExpired = (expiryDate: any): boolean => {
  if (!expiryDate) return true;
  
  const now = new Date();
  const expiry = expiryDate.toDate ? expiryDate.toDate() : new Date(expiryDate);
  
  return now > expiry;
};

// Update user plan details
export const updateUserPlanDetails = async (planId: string, updates: {
  planName?: string;
  amount?: string;
  paymentMethod?: string;
  utrNumber?: string;
  remarks?: string;
  expiryDate?: Date;
}) => {
  try {
    const { doc, updateDoc } = await import('firebase/firestore');
    const planRef = doc(db, 'userPlans', planId);
    
    const updateData: any = {
      ...updates,
      updatedAt: serverTimestamp()
    };
    
    await updateDoc(planRef, updateData);
    return { success: true };
  } catch (error) {
    return { success: false, error };
  }
};
