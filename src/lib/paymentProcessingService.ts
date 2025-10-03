// Payment Processing Service for processing payments via API

interface ProcessPaymentRequest {
  payment_id: string;
  user_id: string;
  plan_name: string;
}

interface ProcessPaymentResponse {
  status: string;
  message: string;
  timestamp: string;
  payment_id: string;
  user_id: string;
  plan_name: string;
  custom_claims: {
    is_premium: boolean;
    plan_name: string;
    start_date: string;
    end_date: string;
  };
  steps_completed: string[];
  steps_failed: string[];
  steps_not_processed: string[];
  step_details: {
    completed: string[];
    failed: string[];
    not_processed: string[];
    total_steps: number;
  };
}

export const processPayment = async (paymentData: ProcessPaymentRequest): Promise<ProcessPaymentResponse> => {
  try {
    // Get the current user's auth token
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();

    const response = await fetch('https://app-xu56lm6qaa-uc.a.run.app/process-payment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(paymentData)
    });

    if (response.ok) {
      const result = await response.json();
      return result;
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};
