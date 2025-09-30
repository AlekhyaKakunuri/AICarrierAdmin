import { collection, addDoc, serverTimestamp, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export interface PaymentData {
  id?: string;
  amount: number;
  created_at: any;
  payment_id: string;
  payment_method: string;
  payment_screenshot_url?: string;
  plan_name: string;
  remarks?: string;
  status: 'pending' | 'success' | 'rejected';
  updated_at: any;
  user_email: string;
  user_id: string;
  utr_number?: string;
  verified_by?: string;
  verified_at?: any;
}

export const savePaymentDetails = async (paymentData: Omit<PaymentData, 'id' | 'created_at' | 'updated_at' | 'status' | 'verified_by' | 'verified_at'>) => {
  try {
    // Clean the data to remove undefined values
    const cleanData = {
      amount: paymentData.amount,
      payment_id: paymentData.payment_id,
      payment_method: paymentData.payment_method,
      payment_screenshot_url: paymentData.payment_screenshot_url || '',
      plan_name: paymentData.plan_name,
      remarks: paymentData.remarks || '',
      status: 'pending',
      user_email: paymentData.user_email,
      user_id: paymentData.user_id,
      utr_number: paymentData.utr_number || '',
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };

    const docRef = await addDoc(collection(db, 'payments'), cleanData);
    
    return { success: true, id: docRef.id };
  } catch (error) {
    return { success: false, error: error };
  }
};

export const updatePaymentStatus = async (paymentId: string, status: 'success' | 'rejected', verifiedBy?: string, remarks?: string) => {
  try {
    const paymentRef = doc(db, 'payments', paymentId);
    
    const updateData: any = {
      status: status,
      verified_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    };
    
    if (verifiedBy) {
      updateData.verified_by = verifiedBy;
    }
    
    if (remarks) {
      updateData.remarks = remarks;
    }
    
    await updateDoc(paymentRef, updateData);
    
    // If payment is successful, also create a user plan
    if (status === 'success') {
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
    const paymentDoc = await getDoc(paymentRef);
    
    if (!paymentDoc.exists()) {
      return;
    }
    
    const paymentData = paymentDoc.data();
    
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
      status: 'active',
      startDate: now,
      expiryDate: expiryDate,
      paymentId: paymentData.payment_id,
      amount: paymentData.amount.toString(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    
    const userPlanRef = await addDoc(collection(db, 'userPlans'), userPlanData);
    
  } catch (error) {
    console.error('Error creating user plan from payment:', error);
  }
};
