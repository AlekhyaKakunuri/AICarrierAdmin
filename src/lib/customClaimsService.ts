// Custom Claims API Service
const API_BASE_URL = 'https://app-xu56lm6qaa-uc.a.run.app';
import { getUserRoleFromJWT } from './jwtDecoder';

export interface CustomClaims {
  is_premium: boolean;
  plan_name: string;
  start_date: string;
  end_date: string;
  role: string;
}

export interface CustomClaimsResponse {
  status: string;
  message: string;
  user_id: string;
  email: string;
  search_by: string;
  search_value: string;
  custom_claims: CustomClaims;
  timestamp: string;
}

export interface CustomClaimsListResponse {
  status: string;
  message: string;
  users: Array<{
    user_id: string;
    email?: string;
    custom_claims: CustomClaims;
  }>;
}

// Helper function to get JWT token from Firebase Auth
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { getAuth } = await import('firebase/auth');
    const { auth } = await import('@/lib/firebase');
    const user = auth.currentUser;
    if (user) {
      return await user.getIdToken();
    }
    return null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Helper function to get user role from JWT token
const getUserRoleFromToken = async (): Promise<string | null> => {
  try {
    const token = await getAuthToken();
    if (token) {
      return getUserRoleFromJWT(token);
    }
    return null;
  } catch (error) {
    console.error('Error getting user role from token:', error);
    return null;
  }
};

// Get custom claims for a specific user
export const getCustomClaims = async (searchValue: string, searchType: 'user_id' | 'email' = 'user_id'): Promise<CustomClaimsResponse> => {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    // Use different parameter based on search type
    const paramName = searchType === 'user_id' ? 'user_id' : 'email';
    const response = await fetch(`${API_BASE_URL}/get-custom-claims?${paramName}=${encodeURIComponent(searchValue)}`, {
      method: 'GET',
      headers,
      mode: 'cors',
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error(`User not found. Please check if the User ID or Email is correct.`);
      }
      throw new Error(`Failed to get custom claims: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('CORS or network error:', error);
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Get all custom claims with search parameter
export const getAllCustomClaims = async (searchParam?: string): Promise<CustomClaimsListResponse> => {
  const token = await getAuthToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Build URL with search parameter
  let url = `${API_BASE_URL}/get-all-custom-claims`;
  if (searchParam) {
    url += `?user-id=${encodeURIComponent(searchParam)}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers,
      mode: 'cors',
    });
    
    if (!response.ok) {
      throw new Error(`Failed to get all custom claims: ${response.statusText}`);
    }
    
    return response.json();
  } catch (error) {
    console.error('CORS or network error:', error);
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Set custom claims for a user
export const setCustomClaims = async (userId: string, customClaims: CustomClaims): Promise<CustomClaimsResponse> => {
  const token = await getAuthToken();
  const userRole = await getUserRoleFromToken();
  
  // Check if user has admin role
  if (userRole !== 'admin') {
    throw new Error('Access denied: Only admin users can set custom claims');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include the decoded role in custom claims
  const claimsWithRole = {
    ...customClaims,
    role: userRole // Include the decoded role from JWT
  };

  console.log('🔐 Setting custom claims with role:', {
    userId,
    userRole,
    claimsWithRole
  });

  const response = await fetch(`${API_BASE_URL}/set-custom-claims`, {
    method: 'POST',
    headers,
    mode: 'cors',
    body: JSON.stringify({
      user_id: userId,
      custom_claims: claimsWithRole
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to set custom claims: ${response.statusText}`);
  }
  
  return response.json();
};

// Update custom claims for a user
export const updateCustomClaims = async (userId: string, customClaims: Partial<CustomClaims>): Promise<CustomClaimsResponse> => {
  const token = await getAuthToken();
  const userRole = await getUserRoleFromToken();
  
  // Check if user has admin role
  if (userRole !== 'admin') {
    throw new Error('Access denied: Only admin users can update custom claims');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Include the decoded role in custom claims
  const claimsWithRole = {
    ...customClaims,
    role: userRole // Include the decoded role from JWT
  };

  console.log('🔐 Updating custom claims with role:', {
    userId,
    userRole,
    claimsWithRole
  });

  const response = await fetch(`${API_BASE_URL}/update-custom-claims`, {
    method: 'PUT',
    headers,
    mode: 'cors',
    body: JSON.stringify({
      user_id: userId,
      custom_claims: claimsWithRole
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to update custom claims: ${response.statusText}`);
  }
  
  return response.json();
};

// Delete specific fields from custom claims
export const deleteCustomClaims = async (userId: string, fieldsToDelete: string[]): Promise<CustomClaimsResponse> => {
  const token = await getAuthToken();
  const userRole = await getUserRoleFromToken();
  
  // Check if user has admin role
  if (userRole !== 'admin') {
    throw new Error('Access denied: Only admin users can delete custom claims');
  }
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  console.log('🔐 Deleting custom claims with role:', {
    userId,
    userRole,
    fieldsToDelete
  });

  const response = await fetch(`${API_BASE_URL}/delete-custom-claims`, {
    method: 'DELETE',
    headers,
    mode: 'cors',
    body: JSON.stringify({
      user_id: userId,
      fields_to_delete: fieldsToDelete
    })
  });
  
  if (!response.ok) {
    throw new Error(`Failed to delete custom claims: ${response.statusText}`);
  }
  
  return response.json();
};

// Helper function to create custom claims from payment data
export const createCustomClaimsFromPayment = (payment: {
  plan_name: string;
  user_id: string;
  user_email: string;
}): CustomClaims => {
  const now = new Date();
  const startDate = now.toISOString();
  
  // Calculate end date based on plan
  const planDurations: { [key: string]: number } = {
    'Premium - Monthly (₹449)': 1,
    'Premium - Yearly (₹4308)': 12,
    'AI Fundamentals (₹30000)': 12,
    'PREMIUM_MONTHLY': 1,
    'PREMIUM_YEARLY': 12,
    'PREMIUM_GENAI_DEV_01': 12
  };
  
  const durationInMonths = planDurations[payment.plan_name] || 1;
  const endDate = new Date(now);
  endDate.setMonth(endDate.getMonth() + durationInMonths);
  const endDateISOString = endDate.toISOString();
  
  // Map payment plan names to custom claims plan names
  const planMapping: { [key: string]: string } = {
    'Premium - Monthly (₹449)': 'PREMIUM_MONTHLY',
    'Premium - Yearly (₹4308)': 'PREMIUM_YEARLY',
    'AI Fundamentals (₹30000)': 'PREMIUM_GENAI_DEV_01',
    'PREMIUM_MONTHLY': 'PREMIUM_MONTHLY',
    'PREMIUM_YEARLY': 'PREMIUM_YEARLY',
    'PREMIUM_GENAI_DEV_01': 'PREMIUM_GENAI_DEV_01',
  };
  
  return {
    is_premium: true,
    plan_name: planMapping[payment.plan_name] || 'PREMIUM_MONTHLY',
    start_date: startDate,
    end_date: endDateISOString,
    role: 'user'
  };
};