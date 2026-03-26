/**
 * AuthGuard Component
 * 
 * Protects routes and components from unauthorized access.
 * Enforces authentication and role-based authorization.
 */

import React, { useEffect } from 'react';
import { useApp } from '@/app/context/AppContext';
import { hasRole, hasBranchAccess } from '@/app/services/securityService';
import { Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/app/components/ui/card';

interface AuthGuardProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  requiredBranchId?: string;
  fallback?: React.ReactNode;
  redirectTo?: string;
}

/**
 * AuthGuard - Protects components based on authentication and authorization
 */
export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requiredRoles = [],
  requiredBranchId,
  fallback,
  redirectTo,
}) => {
  const { currentUser, authLoading } = useApp();

  useEffect(() => {
    // Track unauthorized access attempts
    if (!authLoading && !currentUser) {
      console.warn('[SECURITY] Unauthorized access attempt detected');
    }
  }, [currentUser, authLoading]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-[#B8860B] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[#E8D5A3]">Verifying authentication...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (!currentUser) {
    return fallback || (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] p-6">
        <Card className="max-w-md w-full bg-[#1A1A1A] border-[#B8860B]/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#E8D5A3] mb-2">
              Authentication Required
            </h2>
            <p className="text-[#D4AF37]/60 mb-6">
              You must be logged in to access this page.
            </p>
            <button
              onClick={() => window.location.href = redirectTo || '/'}
              className="px-6 py-2 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white rounded-lg transition-all"
            >
              Go to Login
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role-based access
  if (requiredRoles.length > 0 && !hasRole(currentUser, requiredRoles)) {
    console.warn(`[SECURITY] Access denied for user ${currentUser.id} (role: ${currentUser.role}). Required roles:`, requiredRoles);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] p-6">
        <Card className="max-w-md w-full bg-[#1A1A1A] border-[#B8860B]/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#E8D5A3] mb-2">
              Access Denied
            </h2>
            <p className="text-[#D4AF37]/60 mb-2">
              You don't have permission to access this resource.
            </p>
            <p className="text-sm text-[#D4AF37]/40 mb-6">
              Your role: <span className="font-semibold text-[#B8860B]">{currentUser.role}</span>
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white rounded-lg transition-all"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check branch-level access
  if (requiredBranchId && !hasBranchAccess(currentUser, requiredBranchId)) {
    console.warn(`[SECURITY] Branch access denied for user ${currentUser.id}. Required branch: ${requiredBranchId}`);
    
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A] p-6">
        <Card className="max-w-md w-full bg-[#1A1A1A] border-[#B8860B]/20">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-amber-500" />
            </div>
            <h2 className="text-2xl font-bold text-[#E8D5A3] mb-2">
              Branch Access Denied
            </h2>
            <p className="text-[#D4AF37]/60 mb-6">
              You don't have permission to access data from this branch.
            </p>
            <button
              onClick={() => window.history.back()}
              className="px-6 py-2 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white rounded-lg transition-all"
            >
              Go Back
            </button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // User is authenticated and authorized
  return <>{children}</>;
};

/**
 * Higher-Order Component for wrapping components with AuthGuard
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options: Omit<AuthGuardProps, 'children'> = {}
) {
  return function WrappedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    );
  };
}
