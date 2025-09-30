import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { 
  getUserPlans, 
  verifyPayment, 
  updatePlan, 
  updateUserPlanDetails,
  UserPlan, 
  isPlanExpired 
} from '@/lib/userPlanService';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { 
  CheckCircle, 
  Clock, 
  XCircle, 
  Calendar, 
  Edit, 
  RefreshCw,
  User,
  CreditCard
} from 'lucide-react';

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

const UserPlansManagement = () => {
  const [successPayments, setSuccessPayments] = useState<PaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<PaymentData | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'extend' | 'change' | 'update'>('extend');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const [updateFormData, setUpdateFormData] = useState({
    planName: '',
    amount: '',
    paymentMethod: '',
    utrNumber: '',
    remarks: '',
    expiryDate: ''
  });
  const { toast } = useToast();

  const planOptions = [
    'Free',
    'Premium - Monthly (₹449)',
    'Premium - Yearly (₹4308)',
    'AI Fundamentals (₹30000)'
  ];

  useEffect(() => {
    fetchSuccessPayments();
    
    // Listen for refresh events from PaymentAdmin
    const handleRefresh = () => {
      fetchSuccessPayments();
    };
    
    window.addEventListener('refreshUserPlans', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshUserPlans', handleRefresh);
    };
  }, []);

  const fetchSuccessPayments = async () => {
    try {
      setLoading(true);
      const q = query(collection(db, 'payments'), orderBy('created_at', 'desc'));
      
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const paymentsData: PaymentData[] = [];
        querySnapshot.forEach((doc) => {
          const payment = {
            id: doc.id,
            ...doc.data()
          } as PaymentData;
          
          // Only include success payments
          if (payment.status === 'success') {
            paymentsData.push(payment);
          }
        });
        
        setSuccessPayments(paymentsData);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load success payments",
        variant: "destructive"
      });
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string, planName: string, amount?: string) => {
    try {
      await verifyPayment(paymentId, planName, amount);
      await fetchSuccessPayments();
      toast({
        title: "Payment Verified",
        description: "Plan has been activated successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify payment",
        variant: "destructive"
      });
    }
  };

  const handleUpdatePlan = async () => {
    if (!selectedPayment) return;

    try {
      if (modalType === 'update') {
        // Update payment details in the payments collection
        const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
        const paymentRef = doc(db, 'payments', selectedPayment.id);
        
        const updates: any = {};
        if (updateFormData.planName) updates.plan_name = updateFormData.planName;
        if (updateFormData.amount) updates.amount = parseInt(updateFormData.amount);
        if (updateFormData.paymentMethod) updates.payment_method = updateFormData.paymentMethod;
        if (updateFormData.utrNumber) updates.utr_number = updateFormData.utrNumber;
        if (updateFormData.remarks) updates.remarks = updateFormData.remarks;
        updates.updated_at = serverTimestamp();
        
        await updateDoc(paymentRef, updates);
      } else {
        // For extend/change, we would need to create user plans
        // This functionality can be added later if needed
        toast({
          title: "Info",
          description: "Extend/Change functionality not available for success payments",
        });
        return;
      }

      await fetchSuccessPayments();
      
      toast({
        title: "Payment Updated",
        description: `Payment details updated successfully`,
      });
      
      setIsModalOpen(false);
      setSelectedPayment(null);
      setNewExpiryDate('');
      setNewPlanName('');
      setUpdateFormData({
        planName: '',
        amount: '',
        paymentMethod: '',
        utrNumber: '',
        remarks: '',
        expiryDate: ''
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment",
        variant: "destructive"
      });
    }
  };

  const handleOpenUpdateModal = (payment: PaymentData) => {
    setSelectedPayment(payment);
    setModalType('update');
    setUpdateFormData({
      planName: payment.plan_name,
      amount: payment.amount.toString(),
      paymentMethod: payment.payment_method || '',
      utrNumber: payment.utr_number || '',
      remarks: payment.remarks || '',
      expiryDate: payment.created_at?.toDate?.()?.toISOString().split('T')[0] || ''
    });
    setIsModalOpen(true);
  };

  const openModal = (payment: PaymentData, type: 'extend' | 'change') => {
    setSelectedPayment(payment);
    setModalType(type);
    setIsModalOpen(true);
    
    if (type === 'extend' && payment.created_at) {
      const expiry = payment.created_at.toDate ? payment.created_at.toDate() : new Date(payment.created_at);
      setNewExpiryDate(expiry.toISOString().split('T')[0]);
    }
  };

  const getStatusBadge = (payment: PaymentData) => {
    switch (payment.status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">Success</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Rejected</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const calculateExpiryDate = (payment: any) => {
    if (!payment.created_at) return 'N/A';
    
    const startDate = payment.created_at.toDate ? payment.created_at.toDate() : new Date(payment.created_at);
    let expiryDate = new Date(startDate);
    
    // Calculate expiry based on plan type
    if (payment.plan_name.includes('MONTHLY')) {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else if (payment.plan_name.includes('YEARLY') || payment.plan_name.includes('ANNUAL')) {
      expiryDate.setFullYear(expiryDate.getFullYear() + 1);
    } else if (payment.plan_name.includes('LIFETIME')) {
      return 'Lifetime';
    } else {
      // Default to 1 month for other plans
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    }
    
    return expiryDate.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <RefreshCw className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading user plans...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            User Plans Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-3 font-medium">User</th>
                  <th className="text-left p-3 font-medium">Plan</th>
                  <th className="text-left p-3 font-medium">Status</th>
                  <th className="text-left p-3 font-medium">Start Date</th>
                  <th className="text-left p-3 font-medium">Expiry Date</th>
                  <th className="text-left p-3 font-medium">Payment Info</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {successPayments.map((payment) => (
                  <tr key={payment.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{payment.user_email}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{payment.plan_name}</span>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(payment)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(payment.created_at)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{calculateExpiryDate(payment)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-gray-500" />
                          <span className="font-mono text-sm">{payment.payment_id}</span>
                        </div>
                        {payment.payment_method && (
                          <div className="text-xs text-gray-600">
                            Method: {payment.payment_method}
                          </div>
                        )}
                        {payment.utr_number && (
                          <div className="text-xs text-gray-600">
                            UTR: {payment.utr_number}
                          </div>
                        )}
                        {payment.remarks && (
                          <div className="text-xs text-gray-600 max-w-xs truncate" title={payment.remarks}>
                            {payment.remarks}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">₹{payment.amount.toLocaleString()}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenUpdateModal(payment)}
                          className="bg-blue-50 hover:bg-blue-100 border-blue-200 text-blue-700"
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Update
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {successPayments.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No success payments found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unified Modal for Extend/Change/Update Plan */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              Update Payment Details
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="planName">Plan Name</Label>
                    <Input
                      id="planName"
                      value={updateFormData.planName}
                      onChange={(e) => setUpdateFormData({...updateFormData, planName: e.target.value})}
                      placeholder="e.g., PREMIUM_GENAI_DEV_01"
                    />
                  </div>
                  <div>
                    <Label htmlFor="amount">Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={updateFormData.amount}
                      onChange={(e) => setUpdateFormData({...updateFormData, amount: e.target.value})}
                      placeholder="29999"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                    <Input
                      id="paymentMethod"
                      value={updateFormData.paymentMethod}
                      onChange={(e) => setUpdateFormData({...updateFormData, paymentMethod: e.target.value})}
                      placeholder="e.g., UPI, Card, Net Banking"
                    />
                  </div>
                  <div>
                    <Label htmlFor="utrNumber">UTR Number</Label>
                    <Input
                      id="utrNumber"
                      value={updateFormData.utrNumber}
                      onChange={(e) => setUpdateFormData({...updateFormData, utrNumber: e.target.value})}
                      placeholder="e.g., UPI123456789"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="remarks">Remarks</Label>
                  <Input
                    id="remarks"
                    value={updateFormData.remarks}
                    onChange={(e) => setUpdateFormData({...updateFormData, remarks: e.target.value})}
                    placeholder="e.g., Payment verified by admin"
                  />
                </div>
                
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    type="date"
                    value={updateFormData.expiryDate}
                    onChange={(e) => setUpdateFormData({...updateFormData, expiryDate: e.target.value})}
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
              </div>
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdatePlan} className="flex-1">
                Update Payment
              </Button>
              <Button variant="outline" onClick={() => setIsModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserPlansManagement;
