// Invoice Service for sending invoices via Cloud Function

interface SendInvoiceRequest {
  name: string;
  email: string;
  amount: number;
  plan_name: string;
  utr: string;
  payment_id?: string;
  notes?: string;
  terms?: string;
  payment_method?: string;
  verified_by?: string;
}

interface SendInvoiceResponse {
  success: boolean;
  message: string;
  invoice_id?: string;
  error?: string;
}

export const sendInvoice = async (invoiceData: SendInvoiceRequest): Promise<SendInvoiceResponse> => {
  try {
    // Get the current user's auth token
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;

    if (!user) {
      throw new Error('User not authenticated');
    }

    const token = await user.getIdToken();

    const response = await fetch('https://us-central1-aicareerx-51133.cloudfunctions.net/send_invoice', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(invoiceData)
    });

    if (response.ok) {
      const result = await response.json();
      return {
        success: true,
        message: result.message || 'Invoice sent successfully',
        invoice_id: result.invoice_id
      };
    } else {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error sending invoice:', error);
    return {
      success: false,
      message: 'Failed to send invoice',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};
