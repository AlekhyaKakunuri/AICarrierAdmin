import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RefreshCw } from 'lucide-react';

interface PaymentData {
  id: string;
  transactionId: string;
  planName: string;
  amount: string;
  userEmail?: string;
  userName?: string;
  paymentScreenshot?: string;
  status: 'pending' | 'verified' | 'rejected';
  createdAt: any;
  verifiedAt?: any;
  notes?: string;
}

interface Stats {
  activeSubscriptions: number;
  pendingPayments: number;
  totalRevenue: number;
  totalPayments: number;
}

const AdminStats = () => {
  const [stats, setStats] = useState<Stats>({
    activeSubscriptions: 0,
    pendingPayments: 0,
    totalRevenue: 0,
    totalPayments: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, 'payments'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const paymentsData: PaymentData[] = [];
      querySnapshot.forEach((doc) => {
        paymentsData.push({
          id: doc.id,
          ...doc.data()
        } as PaymentData);
      });

      // Calculate real stats from Firebase data
      const activeSubscriptions = paymentsData.filter(p => p.status === 'verified').length;
      const pendingPayments = paymentsData.filter(p => p.status === 'pending').length;
      const totalRevenue = paymentsData
        .filter(p => p.status === 'verified')
        .reduce((sum, p) => sum + parseInt(p.amount || '0'), 0);
      const totalPayments = paymentsData.length;

      setStats({
        activeSubscriptions,
        pendingPayments,
        totalRevenue,
        totalPayments
      });
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="bg-gradient-to-r from-gray-200 to-gray-300">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium opacity-90">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center">
                <RefreshCw className="h-6 w-6 animate-spin" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
      <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Active Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.activeSubscriptions}</div>
          <p className="text-blue-100 text-sm">Verified payments</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-yellow-500 to-yellow-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Pending Payments</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">{stats.pendingPayments}</div>
          <p className="text-yellow-100 text-sm">Awaiting verification</p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium opacity-90">Total Revenue</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold">₹{stats.totalRevenue}</div>
          <p className="text-green-100 text-sm">From {stats.activeSubscriptions} verified payments</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminStats;

