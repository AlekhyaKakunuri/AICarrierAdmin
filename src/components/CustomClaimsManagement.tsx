import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useRefresh } from '@/contexts/RefreshContext';
import { 
  getCustomClaims, 
  updateCustomClaims, 
  deleteCustomClaims,
  CustomClaims,
  CustomClaimsResponse,
  CustomClaimsListResponse
} from '@/lib/customClaimsService';
import { 
  Search, 
  Edit, 
  Trash2, 
  RefreshCw, 
  User, 
  Calendar,
  Crown,
  Loader2,
  CheckCircle
} from 'lucide-react';

interface CustomClaimsUser {
  user_id: string;
  email: string;
  custom_claims: CustomClaims;
}

const CustomClaimsManagement = () => {
  // Session data - stores all verified payments in current session
  const [successData, setSuccessData] = useState<CustomClaimsUser[]>([]);
  // Search data - stores search results
  const [searchRecords, setSearchRecords] = useState<CustomClaimsUser[]>([]);
  // Current display data - either successData or searchRecords
  const [users, setUsers] = useState<CustomClaimsUser[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [searchUserId, setSearchUserId] = useState('');
  const [searchEmail, setSearchEmail] = useState('');
  const [searchType, setSearchType] = useState<'user_id' | 'email'>('user_id');
  const [hasSearched, setHasSearched] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<CustomClaimsUser | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [editForm, setEditForm] = useState<Partial<CustomClaims>>({});
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const { refreshTrigger } = useRefresh();

  // Auto-refresh when payment is verified (refreshTrigger changes)
  useEffect(() => {
    if (refreshTrigger.count > 0) {
      if (refreshTrigger.userId) {
        // If a specific user was verified, add them to successData
        
        // Get the verified user's claims and add to successData
        const addVerifiedUserToSuccessData = async () => {
          try {
            const response = await getCustomClaims(refreshTrigger.userId!, 'user_id');
            const verifiedUser = { 
              user_id: response.user_id, 
              email: response.email,
              custom_claims: response.custom_claims 
            };
            
            // Add to successData (session data)
            setSuccessData(prev => {
              // Check if user already exists in successData
              const exists = prev.some(user => user.user_id === verifiedUser.user_id);
              if (!exists) {
                return [...prev, verifiedUser];
              }
              return prev;
            });
            
          } catch (error) {
            console.error('Error getting verified user claims:', error);
            toast({
              title: "Error",
              description: `Failed to get claims for verified user: ${error instanceof Error ? error.message : 'Unknown error'}`,
              variant: "destructive"
            });
          }
        };
        
        addVerifiedUserToSuccessData();
      } else if (searchUserId.trim() || searchEmail.trim()) {
        // If we have search results, refresh them
        handleSearch();
      }
    }
  }, [refreshTrigger]);

  // Sync users with successData when no search is active
  useEffect(() => {
    if (!hasSearched) {
      setUsers(successData);
    }
  }, [successData, hasSearched]);

  // Don't load all custom claims on component mount - only on search


  const handleSearch = async () => {
    const searchValue = searchType === 'user_id' ? searchUserId.trim() : searchEmail.trim();
    
    if (!searchValue) {
      toast({
        title: "Search Required",
        description: `Please enter a ${searchType === 'user_id' ? 'User ID' : 'Email'} to search`,
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSearching(true);
      setLoading(true);
      setHasSearched(true);
      
      // Use different parameters based on search type
      const response = await getCustomClaims(searchValue, searchType);
      const searchResult = { 
        user_id: response.user_id, 
        email: response.email,
        custom_claims: response.custom_claims 
      };
      
      // Store in searchRecords
      setSearchRecords([searchResult]);
      // Update display to show searchRecords
      setUsers([searchResult]);
    } catch (error) {
      console.error('Error searching custom claims:', error);
      toast({
        title: "Search Failed",
        description: `Failed to search custom claims: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive"
      });
      setSearchRecords([]);
      setUsers([]);
    } finally {
      setIsSearching(false);
      setLoading(false);
    }
  };

  const handleEdit = (user: CustomClaimsUser) => {
    setSelectedUser(user);
    setEditForm({ ...user.custom_claims });
    setShowEditDialog(true);
  };

  const handleUpdate = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(true);
      await updateCustomClaims(selectedUser.user_id, editForm);
      
      toast({
        title: "Success",
        description: "Custom claims updated successfully"
      });
      
      setShowEditDialog(false);
      setSelectedUser(null);
      setEditForm({});
      
      // Refresh the list
      if (searchUserId.trim() || searchEmail.trim()) {
        handleSearch();
      }
    } catch (error) {
      console.error('Error updating custom claims:', error);
      toast({
        title: "Error",
        description: "Failed to update custom claims",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedUser) return;

    try {
      setProcessing(true);
      await deleteCustomClaims(selectedUser.user_id, ['is_premium', 'plan_name', 'start_date', 'end_date', 'role']);
      
      toast({
        title: "Success",
        description: "Custom claims deleted successfully"
      });
      
      setShowDeleteDialog(false);
      
      // Remove the deleted user from the current list
      setUsers(prevUsers => prevUsers.filter(user => user.user_id !== selectedUser.user_id));
      
      setSelectedUser(null);
      
      // If we have search input, refresh the search results
      if (searchUserId.trim() || searchEmail.trim()) {
        handleSearch();
      }
    } catch (error) {
      console.error('Error deleting custom claims:', error);
      toast({
        title: "Error",
        description: "Failed to delete custom claims",
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      console.error("Invalid date string:", dateString);
      return 'Invalid Date';
    }
  };

  const getPlanBadgeVariant = (planName: string | undefined) => {
    if (!planName) return 'outline';
    if (planName.includes('PREMIUM')) return 'default';
    if (planName.includes('FREE')) return 'secondary';
    return 'outline';
  };

  // Clear search results when input is removed and show successData
  const handleSearchInputChange = (value: string, type: 'user_id' | 'email') => {
    if (type === 'user_id') {
      setSearchUserId(value);
      if (!value.trim()) {
        // Clear search and show successData
        setSearchRecords([]);
        setUsers(successData);
        setHasSearched(false);
      }
    } else {
      setSearchEmail(value);
      if (!value.trim()) {
        // Clear search and show successData
        setSearchRecords([]);
        setUsers(successData);
        setHasSearched(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Custom Claims Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 mb-6">
            {/* Search Type Selection */}
            <div className="flex gap-4 items-center">
              <Label className="text-sm font-medium">Search by:</Label>
              <Select value={searchType} onValueChange={(value: 'user_id' | 'email') => setSearchType(value)}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user_id">User ID</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Search Input */}
            <div className="flex gap-4">
              <div className="flex-1">
                {searchType === 'user_id' ? (
                  <Input
                    placeholder="Enter User ID (e.g., GRGwppb0GhNwCRf4NFPZD1xHQk82)"
                    value={searchUserId}
                    onChange={(e) => handleSearchInputChange(e.target.value, 'user_id')}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                ) : (
                  <Input
                    placeholder="Enter Email (e.g., alekhyakakunuri@gmail.com)"
                    value={searchEmail}
                    onChange={(e) => handleSearchInputChange(e.target.value, 'email')}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                  />
                )}
              </div>
              <Button onClick={handleSearch} disabled={isSearching}>
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
                Search
              </Button>
            </div>
          </div>


          {/* Results Header */}
          {users.length > 0 && !loading && (
            <div className="mb-4 p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-primary" />
                  <span className="font-medium">
                    {hasSearched 
                      ? `Search Results (${users.length} found)` 
                      : `Verified Payments Session (${users.length} users)`
                    }
                  </span>
                </div>
                <Badge variant="outline">
                  {users.filter(u => u.custom_claims?.role === 'admin').length} Admin
                </Badge>
              </div>
            </div>
          )}

          {loading ? (
            <div className="flex justify-center items-center h-40">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {hasSearched 
                ? 'No custom claims found for this search' 
                : 'No verified payments in this session. Verify a payment to see custom claims here.'
              }
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3 font-medium">Email</th>
                      <th className="text-left p-3 font-medium">Role</th>
                      <th className="text-left p-3 font-medium">Plan</th>
                      <th className="text-left p-3 font-medium">Start Date</th>
                      <th className="text-left p-3 font-medium">Expiry Date</th>
                      <th className="text-left p-3 font-medium">Is Premium</th>
                      <th className="text-left p-3 font-medium">Actions</th>
                    </tr>
                  </thead>
                <tbody>
                  {users.map((user, index) => (
                    <tr key={user.user_id} className={index % 2 === 0 ? 'bg-muted/50' : ''}>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">
                            {user.email || 'N/A'}
                          </span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={user.custom_claims?.role === 'admin' ? 'default' : 'secondary'}>
                          {user.custom_claims?.role || 'user'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <Badge variant={getPlanBadgeVariant(user.custom_claims?.plan_name)}>
                          {user.custom_claims?.plan_name || 'N/A'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(user.custom_claims?.start_date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm">{formatDate(user.custom_claims?.end_date)}</span>
                        </div>
                      </td>
                      <td className="p-3">
                        <Badge variant={user.custom_claims?.is_premium ? 'default' : 'secondary'}>
                          {user.custom_claims?.is_premium ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(user)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedUser(user);
                              setShowDeleteDialog(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="w-[95vw] max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Custom Claims</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Email - Full width */}
            <div className="col-span-full">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={selectedUser?.email || ''}
                readOnly
                className="bg-muted"
              />
            </div>

            {/* Plan Name and Is Premium - Side by side on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="plan_name">Plan Name</Label>
                <Select
                  value={editForm.plan_name || 'PREMIUM_MONTHLY'}
                  onValueChange={(value) => setEditForm({...editForm, plan_name: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select plan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PREMIUM_MONTHLY">PREMIUM_MONTHLY</SelectItem>
                    <SelectItem value="PREMIUM_YEARLY">PREMIUM_YEARLY</SelectItem>
                    <SelectItem value="PREMIUM_GENAI_DEV_01">PREMIUM_GENAI_DEV_01</SelectItem>
                    <SelectItem value="FREE">FREE</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="is_premium">Is Premium</Label>
                <Select
                  value={editForm.is_premium ? 'true' : 'false'}
                  onValueChange={(value) => setEditForm({...editForm, is_premium: value === 'true'})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select premium status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="true">Yes</SelectItem>
                    <SelectItem value="false">No</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Role - Full width */}
            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={editForm.role || 'user'}
                onValueChange={(value) => setEditForm({...editForm, role: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Start Date and End Date - Side by side on larger screens */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="datetime-local"
                  value={editForm.start_date ? new Date(editForm.start_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditForm({...editForm, start_date: new Date(e.target.value).toISOString()})}
                />
              </div>

              <div>
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="datetime-local"
                  value={editForm.end_date ? new Date(editForm.end_date).toISOString().slice(0, 16) : ''}
                  onChange={(e) => setEditForm({...editForm, end_date: new Date(e.target.value).toISOString()})}
                />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-4">
              <Button 
                onClick={handleUpdate} 
                disabled={processing}
                className="flex-1 order-2 sm:order-1"
              >
                {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Claims
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowEditDialog(false)}
                className="flex-1 order-1 sm:order-2"
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[95vw] max-w-md">
          <DialogHeader>
            <DialogTitle>Delete Custom Claims</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>Are you sure you want to delete custom claims for user <strong>{selectedUser?.email}</strong>?</p>
            <p className="text-sm text-muted-foreground mt-2">
              This action will remove all custom claims for this user.
            </p>
          </div>
          <div className="flex gap-2 pt-4">
            <Button 
              variant="destructive" 
              onClick={handleDelete} 
              disabled={processing}
              className="flex-1"
            >
              {processing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete Claims
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setShowDeleteDialog(false)}
              className="flex-1"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CustomClaimsManagement;