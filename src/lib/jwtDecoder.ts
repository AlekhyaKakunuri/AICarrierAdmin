// JWT Decoder utility to extract custom claims
export interface DecodedJWT {
  iss: string;
  aud: string;
  auth_time: number;
  user_id: string;
  sub: string;
  iat: number;
  exp: number;
  email: string;
  email_verified: boolean;
  firebase: {
    identities: {
      email: string[];
    };
    sign_in_provider: string;
  };
  role?: string; // Custom claim for role
  [key: string]: any; // For other custom claims
}

export const decodeJWT = (token: string): DecodedJWT | null => {
  try {
    // JWT has 3 parts separated by dots: header.payload.signature
    const parts = token.split('.');
    if (parts.length !== 3) {
      console.error('Invalid JWT format');
      return null;
    }

    // Decode the payload (second part)
    const payload = parts[1];
    
    // Add padding if needed
    const paddedPayload = payload + '='.repeat((4 - payload.length % 4) % 4);
    
    // Decode base64
    const decodedPayload = atob(paddedPayload);
    
    // Parse JSON
    const claims = JSON.parse(decodedPayload);
    
    console.log('🔐 Decoded JWT Claims:', claims);
    
    return claims as DecodedJWT;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
};

export const getUserRoleFromJWT = (token: string): string | null => {
  const decoded = decodeJWT(token);
  return decoded?.role || null;
};

export const isAdminFromJWT = (token: string): boolean => {
  const role = getUserRoleFromJWT(token);
  return role === 'admin';
};
