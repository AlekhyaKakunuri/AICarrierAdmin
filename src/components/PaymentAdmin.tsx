import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { CheckCircle, XCircle, Clock, RefreshCw, Eye, Loader2, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { addPaymentToUserPlans, checkPaymentExistsInUserPlans, getAllUserPlans } from '@/lib/userPlanService';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentData {
  id: string;
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

const PaymentAdmin = () => {
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [showVerifyDialog, setShowVerifyDialog] = useState(false);
  const [showRejectDialog, setShowRejectDialog] = useState(false);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [rejectionNotes, setRejectionNotes] = useState('');
  const [processing, setProcessing] = useState(false);
  const [processingPaymentId, setProcessingPaymentId] = useState<string | null>(null);
  const [paymentExistsInUserPlans, setPaymentExistsInUserPlans] = useState<{[key: string]: boolean}>({});
  const { toast } = useToast();
  const { currentUser } = useAuth();


  // Check if payments exist in user plans - FIXED FOR DUPLICATE PAYMENT IDs
  const checkPaymentsInUserPlans = async (payments: PaymentData[]) => {
    try {
      // Get all userPlans
      const userPlansSnapshot = await getDocs(collection(db, 'userPlans'));
      
      // Create a map of existing payments (payment_id + amount as key)
      const existingPayments = new Map<string, any>();
      userPlansSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.paymentId && data.amount) {
          const key = `${data.paymentId}_${data.amount}`;
          existingPayments.set(key, data);
        }
      });
      
      // Check each payment using payment_id + amount as unique key
      const existsMap: {[key: string]: boolean} = {};
      
      payments.forEach(payment => {
        if (payment.status === 'success') {
          const key = `${payment.payment_id}_${payment.amount}`;
          const exists = existingPayments.has(key);
          // Use the unique key for the map
          existsMap[key] = exists;
        }
      });
      
      setPaymentExistsInUserPlans(existsMap);
      
    } catch (error) {
      setPaymentExistsInUserPlans({});
    }
  };

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('created_at', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      const paymentsData: PaymentData[] = [];
      querySnapshot.forEach((doc) => {
        paymentsData.push({
          id: doc.id,
          ...doc.data()
        } as PaymentData);
      });
      
      // Filter out success payments - only show pending and rejected
      const filteredPayments = paymentsData.filter(payment => 
        payment.status?.toLowerCase() !== 'success'
      );
      
      setPayments(filteredPayments);
      setLoading(false);
      
      // Check which payments exist in user plans
      await checkPaymentsInUserPlans(filteredPayments);
    });

    return () => unsubscribe();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'rejected':
        return <Badge className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
    }
  };

  const handleVerifyPayment = async () => {
    if (!selectedPayment) return;

    try {
      setProcessing(true);
      
      // Update payment status in Firebase
      const paymentRef = doc(db, 'payments', selectedPayment.id);
      await updateDoc(paymentRef, {
        status: 'success',
        verified_at: serverTimestamp(),
        verified_by: currentUser?.email || 'admin',
        remarks: verificationNotes.trim() || `Payment verified by ${currentUser?.email || 'admin'}`,
        updated_at: serverTimestamp()
      });

      toast({
        title: "Payment Verified!",
        description: "Payment has been verified and user's plan will be activated.",
      });

      setShowVerifyDialog(false);
      setVerificationNotes('');
      setSelectedPayment(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleAddToUserPlans = async (payment: PaymentData) => {
    try {
      setProcessing(true);
      setProcessingPaymentId(payment.id);
      
      const result = await addPaymentToUserPlans({
        id: payment.id,
        amount: payment.amount,
        created_at: payment.created_at,
        payment_id: payment.payment_id,
        payment_method: payment.payment_method,
        payment_screenshot_url: payment.payment_screenshot_url,
        plan_name: payment.plan_name,
        remarks: payment.remarks,
        status: payment.status,
        updated_at: payment.updated_at,
        user_email: payment.user_email,
        user_id: payment.user_id,
        utr_number: payment.utr_number,
        verified_by: payment.verified_by,
        verified_at: payment.verified_at
      });

      if (result.success) {
        toast({
          title: "Added to User Plans!",
          description: "Payment has been added to user plans management.",
        });
        // Update the payment existence status using composite key
        setPaymentExistsInUserPlans(prev => ({
          ...prev,
          [`${payment.payment_id}_${payment.amount}`]: true
        }));
        
        // Trigger a refresh of user plans data
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshUserPlans'));
        }, 1000);
      } else {
        throw new Error(result.error || 'Failed to add to user plans');
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add payment to user plans. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
      setProcessingPaymentId(null);
    }
  };

  const handleRejectPayment = async () => {
    if (!selectedPayment || !rejectionNotes.trim()) {
      toast({
        title: "Error",
        description: "Please provide a reason for rejection.",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      
      // Update payment status in Firebase
      const paymentRef = doc(db, 'payments', selectedPayment.id);
      await updateDoc(paymentRef, {
        status: 'rejected',
        verified_at: serverTimestamp(),
        verified_by: currentUser?.email || 'admin',
        remarks: rejectionNotes.trim(),
        updated_at: serverTimestamp()
      });

      toast({
        title: "Payment Rejected",
        description: "Payment has been rejected with the provided reason.",
      });

      setShowRejectDialog(false);
      setRejectionNotes('');
      setSelectedPayment(null);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject payment. Please try again.",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setShowDetailsDialog(true);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-6 w-6 animate-spin mr-2" />
        Loading payments...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Payment Management</h2>
        <div className="text-sm text-muted-foreground">
          Pending & Rejected Payments: {payments.length}
        </div>
      </div>

      {payments.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">No pending or rejected payments found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <Card key={payment.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    {payment.plan_name} - ₹{payment.amount}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(payment.status)}
                    {getStatusBadge(payment.status)}
                  </div>
                </div>
                <CardDescription>
                  Payment ID: {payment.payment_id}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Email:</span> {payment.user_email}
                  </div>
                  <div>
                    <span className="font-medium">Date:</span> {payment.created_at?.toDate?.()?.toLocaleString() || 'N/A'}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> ₹{payment.amount}
                  </div>
                  <div>
                    <span className="font-medium">Payment Method:</span> {payment.payment_method}
                  </div>
                  <div>
                    <span className="font-medium">UTR Number:</span> {payment.utr_number || 'N/A'}
                  </div>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowVerifyDialog(true);
                    }}
                    disabled={payment.status?.toLowerCase() !== 'pending'}
                  >
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Verify
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowRejectDialog(true);
                    }}
                    disabled={payment.status?.toLowerCase() !== 'pending'}
                  >
                    <XCircle className="h-3 w-3 mr-1" />
                    Reject
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => handleViewDetails(payment)}
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Verify Payment Dialog */}
      <Dialog open={showVerifyDialog} onOpenChange={setShowVerifyDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Verify Payment</DialogTitle>
            <DialogDescription>
              Verify this payment and activate the user's subscription
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Payment Details:</h4>
                <p><strong>Payment ID:</strong> {selectedPayment.payment_id}</p>
                <p><strong>Plan:</strong> {selectedPayment.plan_name}</p>
                <p><strong>Amount:</strong> ₹{selectedPayment.amount}</p>
                <p><strong>User:</strong> {selectedPayment.user_email}</p>
                <p><strong>Payment Method:</strong> {selectedPayment.payment_method}</p>
                <p><strong>UTR Number:</strong> {selectedPayment.utr_number || 'N/A'}</p>
              </div>
            )}
            <div>
              <Label htmlFor="verificationNotes">Verification Notes (Optional)</Label>
              <Textarea
                id="verificationNotes"
                placeholder="Add any notes about this verification..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowVerifyDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                onClick={handleVerifyPayment}
                disabled={processing}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Payment"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reject Payment Dialog */}
      <Dialog open={showRejectDialog} onOpenChange={setShowRejectDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Payment</DialogTitle>
            <DialogDescription>
              Reject this payment and provide a reason
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedPayment && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Payment Details:</h4>
                <p><strong>Payment ID:</strong> {selectedPayment.payment_id}</p>
                <p><strong>Plan:</strong> {selectedPayment.plan_name}</p>
                <p><strong>Amount:</strong> ₹{selectedPayment.amount}</p>
                <p><strong>User:</strong> {selectedPayment.user_email}</p>
                <p><strong>Payment Method:</strong> {selectedPayment.payment_method}</p>
                <p><strong>UTR Number:</strong> {selectedPayment.utr_number || 'N/A'}</p>
              </div>
            )}
            <div>
              <Label htmlFor="rejectionNotes">Rejection Reason *</Label>
              <Textarea
                id="rejectionNotes"
                placeholder="Please provide a reason for rejection..."
                value={rejectionNotes}
                onChange={(e) => setRejectionNotes(e.target.value)}
                rows={3}
                required
              />
            </div>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowRejectDialog(false)}
                disabled={processing}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleRejectPayment}
                disabled={processing || !rejectionNotes.trim()}
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Rejecting...
                  </>
                ) : (
                  "Reject Payment"
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Details</DialogTitle>
            <DialogDescription>
              Complete information about this payment submission
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="font-medium">Payment ID</Label>
                  <p className="text-sm text-muted-foreground font-mono">{selectedPayment.payment_id}</p>
                </div>
                <div>
                  <Label className="font-medium">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                </div>
                <div>
                  <Label className="font-medium">Plan Name</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.plan_name}</p>
                </div>
                <div>
                  <Label className="font-medium">Amount</Label>
                  <p className="text-sm text-muted-foreground">₹{selectedPayment.amount}</p>
                </div>
                <div>
                  <Label className="font-medium">User ID</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.user_id}</p>
                </div>
                <div>
                  <Label className="font-medium">User Email</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.user_email}</p>
                </div>
                <div>
                  <Label className="font-medium">Payment Method</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.payment_method}</p>
                </div>
                <div>
                  <Label className="font-medium">UTR Number</Label>
                  <p className="text-sm text-muted-foreground">{selectedPayment.utr_number || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-medium">Submitted At</Label>
                  <p className="text-sm text-muted-foreground">
                    {selectedPayment.created_at?.toDate?.()?.toLocaleString() || 'N/A'}
                  </p>
                </div>
                {selectedPayment.verified_at && (
                  <div>
                    <Label className="font-medium">Verified At</Label>
                    <p className="text-sm text-muted-foreground">
                      {selectedPayment.verified_at?.toDate?.()?.toLocaleString() || 'N/A'}
                    </p>
                  </div>
                )}
              </div>
              
              {selectedPayment.payment_screenshot_url && (
                <div>
                  <Label className="font-medium">Payment Screenshot</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPayment.payment_screenshot_url}</p>
                </div>
              )}

              {selectedPayment.remarks && (
                <div>
                  <Label className="font-medium">Remarks</Label>
                  <p className="text-sm text-muted-foreground mt-1">{selectedPayment.remarks}</p>
                </div>
              )}

              <div className="flex justify-end pt-4">
                <Button onClick={() => setShowDetailsDialog(false)}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PaymentAdmin;
