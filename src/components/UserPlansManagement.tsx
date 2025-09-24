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
  UserPlan, 
  isPlanExpired 
} from '@/lib/userPlanService';
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

const UserPlansManagement = () => {
  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlan, setSelectedPlan] = useState<UserPlan | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'extend' | 'change'>('extend');
  const [newExpiryDate, setNewExpiryDate] = useState('');
  const [newPlanName, setNewPlanName] = useState('');
  const { toast } = useToast();

  const planOptions = [
    'Free',
    'Premium - Monthly (₹449)',
    'Premium - Yearly (₹4308)',
    'AI Fundamentals (₹30000)'
  ];

  useEffect(() => {
    fetchUserPlans();
    
    // Listen for refresh events from PaymentAdmin
    const handleRefresh = () => {
      fetchUserPlans();
    };
    
    window.addEventListener('refreshUserPlans', handleRefresh);
    
    return () => {
      window.removeEventListener('refreshUserPlans', handleRefresh);
    };
  }, []);

  const fetchUserPlans = async () => {
    try {
      setLoading(true);
      const plans = await getUserPlans();
      setUserPlans(plans);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load user plans",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (planId: string, planName: string, amount?: string) => {
    try {
      await verifyPayment(planId, planName, amount);
      await fetchUserPlans();
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
    if (!selectedPlan) return;

    try {
      const updates: any = {};
      
      if (modalType === 'extend' && newExpiryDate) {
        updates.expiryDate = new Date(newExpiryDate);
      } else if (modalType === 'change' && newPlanName) {
        updates.planName = newPlanName;
        // Calculate new expiry date based on new plan
        const now = new Date();
        if (newPlanName.toLowerCase().includes('monthly')) {
          updates.expiryDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
        } else {
          updates.expiryDate = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
        }
      }

      await updatePlan(selectedPlan.id, updates);
      await fetchUserPlans();
      
      toast({
        title: "Plan Updated",
        description: `Plan ${modalType === 'extend' ? 'extended' : 'changed'} successfully`,
      });
      
      setIsModalOpen(false);
      setSelectedPlan(null);
      setNewExpiryDate('');
      setNewPlanName('');
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plan",
        variant: "destructive"
      });
    }
  };

  const openModal = (plan: UserPlan, type: 'extend' | 'change') => {
    setSelectedPlan(plan);
    setModalType(type);
    setIsModalOpen(true);
    
    if (type === 'extend' && plan.expiryDate) {
      const expiry = plan.expiryDate.toDate ? plan.expiryDate.toDate() : new Date(plan.expiryDate);
      setNewExpiryDate(expiry.toISOString().split('T')[0]);
    }
  };

  const getStatusBadge = (plan: UserPlan) => {
    const isExpired = isPlanExpired(plan.expiryDate);
    
    if (isExpired) {
      return <Badge variant="destructive" className="bg-red-100 text-red-800">Expired</Badge>;
    }
    
    switch (plan.status) {
      case 'verified':
        return <Badge variant="default" className="bg-green-100 text-green-800">Active</Badge>;
      case 'pending':
        return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">Pending</Badge>;
      case 'cancelled':
        return <Badge variant="destructive" className="bg-red-100 text-red-800">Cancelled</Badge>;
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
                  <th className="text-left p-3 font-medium">Payment ID</th>
                  <th className="text-left p-3 font-medium">Amount</th>
                  <th className="text-left p-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {userPlans.map((plan) => (
                  <tr key={plan.id} className="border-b hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-gray-500" />
                        <span className="font-medium">{plan.userId}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">{plan.planName}</span>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(plan)}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(plan.startDate)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span>{formatDate(plan.expiryDate)}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <span className="font-mono text-sm">{plan.paymentId}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="font-medium">₹{parseInt(plan.amount).toLocaleString()}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        {plan.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleVerifyPayment(plan.id, plan.planName, plan.amount)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </Button>
                        )}
                        
                        {plan.status === 'verified' && (
                          <Button
                            size="sm"
                            disabled
                            className="bg-gray-400"
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verified
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(plan, 'extend')}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Extend
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => openModal(plan, 'change')}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Change
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {userPlans.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No user plans found
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Unified Modal for Extend/Change Plan */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {modalType === 'extend' ? 'Extend Plan' : 'Change Plan'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {modalType === 'extend' ? (
              <div>
                <Label htmlFor="expiryDate">New Expiry Date</Label>
                <Input
                  id="expiryDate"
                  type="date"
                  value={newExpiryDate}
                  onChange={(e) => setNewExpiryDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            ) : (
              <div>
                <Label htmlFor="planName">Select New Plan</Label>
                <Select value={newPlanName} onValueChange={setNewPlanName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a plan" />
                  </SelectTrigger>
                  <SelectContent>
                    {planOptions.map((option) => (
                      <SelectItem key={option} value={option}>
                        {option}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button onClick={handleUpdatePlan} className="flex-1">
                {modalType === 'extend' ? 'Extend Plan' : 'Change Plan'}
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
