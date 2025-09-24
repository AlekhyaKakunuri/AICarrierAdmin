import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface PaymentData {
  transactionId: string;
  planName: string;
  amount: string;
  userEmail?: string;
  userName?: string;
  paymentScreenshot?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: Date;
  verifiedAt?: Date;
  notes?: string;
}

export const savePaymentDetails = async (paymentData: Omit<PaymentData, 'createdAt' | 'status'>) => {
  try {
    // Clean the data to remove undefined values
    const cleanData = {
      transactionId: paymentData.transactionId,
      planName: paymentData.planName,
      amount: paymentData.amount,
      userEmail: paymentData.userEmail || '',
      userName: paymentData.userName || '',
      paymentScreenshot: paymentData.paymentScreenshot || '',
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'payments'), cleanData);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error };
  }
};

export const updatePaymentStatus = async (paymentId: string, status: 'verified' | 'rejected', notes?: string) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    const updateData: any = {
      status: status,
      verifiedAt: serverTimestamp(),
    };
    
    if (notes) {
      updateData.notes = notes;
    }
    
    await updateDoc(paymentRef, updateData);
    
    // If payment is verified, also create a user plan
    if (status === 'verified') {
      await createUserPlanFromPayment(paymentId);
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, error: error };
  }
};

// Create user plan when payment is verified
const createUserPlanFromPayment = async (paymentId: string) => {
  try {
    // Get the payment details
    const paymentRef = doc(db, 'payments', paymentId);
    const paymentDoc = await paymentRef.get();
    
    if (!paymentDoc.exists()) {
      return;
    }
    
    const paymentData = paymentDoc.data();
    
    // Calculate expiry date based on plan
    const now = new Date();
    let expiryDate = new Date();
    
    // Check plan name for explicit period indicators
    if (paymentData.planName.toLowerCase().includes('monthly')) {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (paymentData.planName.toLowerCase().includes('yearly') || paymentData.planName.toLowerCase().includes('year')) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else if (paymentData.planName.toLowerCase().includes('premium')) {
      // For Premium plans, determine period based on amount
      const amount = parseInt(paymentData.amount);
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
    } else if (paymentData.planName.toLowerCase().includes('ai fundamentals')) {
      // AI Fundamentals course - 1 year access
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else {
      // Default to 1 year for other plans
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    }
    
    // Create user plan
    const userPlanData = {
      userId: paymentData.userEmail || '',
      planName: paymentData.planName,
      status: 'verified',
      startDate: now,
      expiryDate: expiryDate,
      paymentId: paymentData.transactionId || paymentId,
      amount: paymentData.amount,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const userPlanRef = await addDoc(collection(db, 'userPlans'), userPlanData);
    
  } catch (error) {
  }
};
