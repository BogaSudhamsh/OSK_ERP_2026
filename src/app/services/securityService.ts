/**
 * Security Service
 * 
 * Provides comprehensive security utilities for the OSK Granite ERP system:
 * - Input validation & sanitization
 * - XSS prevention
 * - Data masking for PII
 * - Rate limiting
 * - Security headers validation
 * - Audit logging
 */

import { User } from '@/app/types';

// ============================================================================
// INPUT VALIDATION & SANITIZATION
// ============================================================================

/**
 * Sanitizes string input to prevent XSS attacks
 */
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
    .trim();
}

/**
 * Validates email format
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates phone number (Indian format)
 */
export function validatePhone(phone: string): boolean {
  // Accepts: 9876543210, +919876543210, 91-9876543210, etc.
  const phoneRegex = /^(\+91|91)?[\s-]?[6-9]\d{9}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
}

/**
 * Validates GST number format
 */
export function validateGST(gst: string): boolean {
  // Format: 22AAAAA0000A1Z5
  const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  return gstRegex.test(gst.toUpperCase());
}

/**
 * Validates and sanitizes numeric input
 */
export function validateNumber(value: any, min?: number, max?: number): { valid: boolean; value: number | null } {
  const num = parseFloat(value);
  
  if (isNaN(num) || !isFinite(num)) {
    return { valid: false, value: null };
  }
  
  if (min !== undefined && num < min) {
    return { valid: false, value: null };
  }
  
  if (max !== undefined && num > max) {
    return { valid: false, value: null };
  }
  
  return { valid: true, value: num };
}

/**
 * Validates date input
 */
export function validateDate(dateString: string): { valid: boolean; date: Date | null } {
  const date = new Date(dateString);
  
  if (isNaN(date.getTime())) {
    return { valid: false, date: null };
  }
  
  // Check if date is not in the future (for most business operations)
  const now = new Date();
  if (date > now) {
    return { valid: false, date: null };
  }
  
  return { valid: true, date };
}

/**
 * Validates string length
 */
export function validateLength(str: string, min: number, max: number): boolean {
  const length = str.trim().length;
  return length >= min && length <= max;
}

/**
 * Validates that a value is not empty
 */
export function validateRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

// ============================================================================
// DATA MASKING & PRIVACY
// ============================================================================

/**
 * Masks phone number for display
 * Example: 9876543210 -> ******3210
 */
export function maskPhone(phone: string): string {
  if (!phone || phone.length < 4) return '****';
  return '*'.repeat(phone.length - 4) + phone.slice(-4);
}

/**
 * Masks email address
 * Example: john@example.com -> j***@example.com
 */
export function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return '****';
  
  const [local, domain] = email.split('@');
  const maskedLocal = local[0] + '*'.repeat(Math.max(local.length - 1, 3));
  return `${maskedLocal}@${domain}`;
}

/**
 * Masks credit card or bank account number
 * Example: 1234567890123456 -> ************3456
 */
export function maskAccountNumber(number: string): string {
  if (!number || number.length < 4) return '****';
  return '*'.repeat(number.length - 4) + number.slice(-4);
}

/**
 * Masks Aadhaar number
 * Example: 123456789012 -> ********9012
 */
export function maskAadhaar(aadhaar: string): string {
  if (!aadhaar || aadhaar.length < 4) return '****';
  return '*'.repeat(aadhaar.length - 4) + aadhaar.slice(-4);
}

// ============================================================================
// AUTHORIZATION & PERMISSIONS
// ============================================================================

/**
 * Checks if user has required role
 */
export function hasRole(user: User | null, requiredRoles: string[]): boolean {
  if (!user) return false;
  return requiredRoles.includes(user.role);
}

/**
 * Checks if user has access to specific branch
 */
export function hasBranchAccess(user: User | null, branchId: string): boolean {
  if (!user) return false;
  
  // Super admin has access to all branches
  if (user.role === 'super-admin' || user.role === 'inventory-manager') {
    return true;
  }
  
  // Other roles only have access to their assigned branch
  return user.branchId === branchId;
}

/**
 * Checks if user can perform specific action
 */
export function canPerformAction(
  user: User | null,
  action: string,
  resourceType: string,
  resourceBranchId?: string
): boolean {
  if (!user) return false;
  
  // Define action permissions per role
  const permissions: Record<string, Record<string, string[]>> = {
    'super-admin': {
      products: ['create', 'read', 'update', 'delete'],
      stock: ['create', 'read', 'update', 'delete', 'transfer'],
      orders: ['create', 'read', 'update', 'delete', 'approve'],
      customers: ['create', 'read', 'update', 'delete'],
      dealers: ['create', 'read', 'update', 'delete'],
      users: ['create', 'read', 'update', 'delete'],
      reports: ['read', 'export'],
    },
    'inventory-manager': {
      products: ['create', 'read', 'update', 'delete'],
      stock: ['create', 'read', 'update', 'transfer'],
      dealers: ['create', 'read', 'update', 'delete'],
      orders: ['read'],
      customers: ['read'],
      reports: ['read', 'export'],
    },
    'branch-admin': {
      stock: ['read'],
      orders: ['create', 'read', 'update'],
      customers: ['create', 'read', 'update'],
      reports: ['read'],
    },
    'stock-manager': {
      stock: ['read', 'update', 'transfer'],
      orders: ['create', 'read', 'update'],
      customers: ['read'],
      products: ['read'],
    },
    'sales-manager': {
      orders: ['create', 'read', 'update'],
      customers: ['create', 'read', 'update'],
      products: ['read'],
      stock: ['read'],
    },
    'cashier': {
      orders: ['create', 'read'],
      customers: ['create', 'read'],
      products: ['read'],
      stock: ['read'],
    },
    'store-staff': {
      orders: ['read'],
      customers: ['read'],
      products: ['read'],
    },
  };
  
  const rolePermissions = permissions[user.role];
  if (!rolePermissions) return false;
  
  const resourcePermissions = rolePermissions[resourceType];
  if (!resourcePermissions) return false;
  
  // Check if action is allowed
  if (!resourcePermissions.includes(action)) return false;
  
  // For branch-specific resources, verify branch access
  if (resourceBranchId && !hasBranchAccess(user, resourceBranchId)) {
    return false;
  }
  
  return true;
}

// ============================================================================
// RATE LIMITING (Client-side)
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitStore: Map<string, RateLimitEntry> = new Map();

/**
 * Simple client-side rate limiting
 * Returns true if action is allowed, false if rate limit exceeded
 */
export function checkRateLimit(
  action: string,
  maxAttempts: number = 10,
  windowMs: number = 60000 // 1 minute
): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(action);
  
  if (!entry || now > entry.resetAt) {
    // Reset or create new entry
    rateLimitStore.set(action, { count: 1, resetAt: now + windowMs });
    return true;
  }
  
  if (entry.count >= maxAttempts) {
    return false;
  }
  
  entry.count++;
  return true;
}

/**
 * Clears rate limit for specific action
 */
export function clearRateLimit(action: string): void {
  rateLimitStore.delete(action);
}

// ============================================================================
// SESSION MANAGEMENT
// ============================================================================

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let lastActivityTime = Date.now();
let sessionTimeoutId: ReturnType<typeof setInterval> | null = null;

/**
 * Updates last activity timestamp
 */
export function updateActivity(): void {
  lastActivityTime = Date.now();
}

/**
 * Checks if session is still valid
 */
export function isSessionValid(): boolean {
  const now = Date.now();
  return (now - lastActivityTime) < SESSION_TIMEOUT;
}

/**
 * Sets up session timeout monitoring
 */
export function setupSessionTimeout(onTimeout: () => void): void {
  if (sessionTimeoutId) {
    clearInterval(sessionTimeoutId);
  }
  
  sessionTimeoutId = setInterval(() => {
    if (!isSessionValid()) {
      onTimeout();
      if (sessionTimeoutId) {
        clearInterval(sessionTimeoutId);
      }
    }
  }, 60000); // Check every minute
}

/**
 * Clears session timeout
 */
export function clearSessionTimeout(): void {
  if (sessionTimeoutId) {
    clearInterval(sessionTimeoutId);
    sessionTimeoutId = null;
  }
}

// ============================================================================
// SECURE DATA HANDLING
// ============================================================================

/**
 * Removes sensitive fields from object before logging or sending
 */
export function removeSensitiveData<T extends Record<string, any>>(
  obj: T,
  sensitiveFields: string[] = ['password', 'token', 'apiKey', 'secret']
): Partial<T> {
  const cleaned = { ...obj };
  
  sensitiveFields.forEach(field => {
    if (field in cleaned) {
      delete cleaned[field];
    }
  });
  
  return cleaned;
}

/**
 * Validates that data doesn't contain SQL injection patterns
 * (Though we use Firestore, good practice for data validation)
 */
export function detectSQLInjection(input: string): boolean {
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(--|\*|;|\/\*|\*\/|xp_|sp_)/i,
    /(UNION.*SELECT|OR.*=.*|AND.*=.*)/i,
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
}

/**
 * Validates file upload
 */
export function validateFileUpload(file: File, allowedTypes: string[], maxSizeMB: number = 5): {
  valid: boolean;
  error?: string;
} {
  // Check file size
  const maxSize = maxSizeMB * 1024 * 1024;
  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSizeMB}MB` };
  }
  
  // Check file type
  const fileType = file.type;
  if (!allowedTypes.some(type => fileType.includes(type))) {
    return { valid: false, error: `Only ${allowedTypes.join(', ')} files are allowed` };
  }
  
  // Check file name for suspicious patterns
  const suspiciousPatterns = /[<>:"|?*\\]/;
  if (suspiciousPatterns.test(file.name)) {
    return { valid: false, error: 'Invalid file name' };
  }
  
  return { valid: true };
}

// ============================================================================
// AUDIT LOGGING
// ============================================================================

export interface AuditLog {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  status: 'success' | 'failure';
  branchId?: string;
}

// In-memory audit log (should be persisted to Firestore in production)
const auditLogs: AuditLog[] = [];

/**
 * Creates an audit log entry
 */
export function createAuditLog(
  user: User,
  action: string,
  resourceType: string,
  resourceId?: string,
  details?: string,
  status: 'success' | 'failure' = 'success'
): AuditLog {
  const log: AuditLog = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date(),
    userId: user.id,
    userName: user.name,
    action,
    resourceType,
    resourceId,
    details,
    status,
    branchId: user.branchId,
  };
  
  auditLogs.push(log);
  
  // Log to console in development (remove in production)
  if (import.meta.env.DEV) {
    console.log('[AUDIT]', log);
  }
  
  return log;
}

/**
 * Gets audit logs with filters
 */
export function getAuditLogs(filters?: {
  userId?: string;
  action?: string;
  resourceType?: string;
  startDate?: Date;
  endDate?: Date;
}): AuditLog[] {
  let filtered = [...auditLogs];
  
  if (filters?.userId) {
    filtered = filtered.filter(log => log.userId === filters.userId);
  }
  
  if (filters?.action) {
    filtered = filtered.filter(log => log.action === filters.action);
  }
  
  if (filters?.resourceType) {
    filtered = filtered.filter(log => log.resourceType === filters.resourceType);
  }
  
  if (filters?.startDate) {
    filtered = filtered.filter(log => log.timestamp >= filters.startDate!);
  }
  
  if (filters?.endDate) {
    filtered = filtered.filter(log => log.timestamp <= filters.endDate!);
  }
  
  return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
}

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

/**
 * Validates product form data
 */
export function validateProductForm(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!validateRequired(data.name)) {
    errors.push({ field: 'name', message: 'Product name is required' });
  }
  
  if (!validateLength(data.name || '', 2, 200)) {
    errors.push({ field: 'name', message: 'Product name must be between 2 and 200 characters' });
  }
  
  const priceValidation = validateNumber(data.price, 0);
  if (!priceValidation.valid) {
    errors.push({ field: 'price', message: 'Price must be a valid positive number' });
  }
  
  const costValidation = validateNumber(data.costPrice, 0);
  if (!costValidation.valid) {
    errors.push({ field: 'costPrice', message: 'Cost price must be a valid positive number' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates customer form data
 */
export function validateCustomerForm(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!validateRequired(data.name)) {
    errors.push({ field: 'name', message: 'Customer name is required' });
  }
  
  if (!validateLength(data.name || '', 2, 100)) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 100 characters' });
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }
  
  if (data.email && !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }
  
  if (data.gst && !validateGST(data.gst)) {
    errors.push({ field: 'gst', message: 'Invalid GST number format' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates order form data
 */
export function validateOrderForm(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!validateRequired(data.customerId)) {
    errors.push({ field: 'customerId', message: 'Customer is required' });
  }
  
  if (!data.items || data.items.length === 0) {
    errors.push({ field: 'items', message: 'At least one item is required' });
  }
  
  if (data.items) {
    data.items.forEach((item: any, index: number) => {
      const qtyValidation = validateNumber(item.quantity, 1);
      if (!qtyValidation.valid) {
        errors.push({ field: `items.${index}.quantity`, message: `Item ${index + 1}: Invalid quantity` });
      }
      
      const priceValidation = validateNumber(item.price, 0);
      if (!priceValidation.valid) {
        errors.push({ field: `items.${index}.price`, message: `Item ${index + 1}: Invalid price` });
      }
    });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates dealer form data
 */
export function validateDealerForm(data: any): ValidationResult {
  const errors: ValidationError[] = [];
  
  if (!validateRequired(data.name)) {
    errors.push({ field: 'name', message: 'Dealer name is required' });
  }
  
  if (!validateLength(data.name || '', 2, 200)) {
    errors.push({ field: 'name', message: 'Name must be between 2 and 200 characters' });
  }
  
  if (data.phone && !validatePhone(data.phone)) {
    errors.push({ field: 'phone', message: 'Invalid phone number format' });
  }
  
  if (data.email && !validateEmail(data.email)) {
    errors.push({ field: 'email', message: 'Invalid email format' });
  }
  
  if (data.gst && !validateGST(data.gst)) {
    errors.push({ field: 'gst', message: 'Invalid GST number format' });
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Generic form validation
 */
export function validateForm(data: any, rules: Record<string, any>): ValidationResult {
  const errors: ValidationError[] = [];
  
  Object.entries(rules).forEach(([field, rule]) => {
    const value = data[field];
    
    if (rule.required && !validateRequired(value)) {
      errors.push({ field, message: rule.requiredMessage || `${field} is required` });
      return;
    }
    
    if (rule.minLength && !validateLength(value || '', rule.minLength, Infinity)) {
      errors.push({ field, message: rule.minLengthMessage || `${field} must be at least ${rule.minLength} characters` });
    }
    
    if (rule.maxLength && !validateLength(value || '', 0, rule.maxLength)) {
      errors.push({ field, message: rule.maxLengthMessage || `${field} must be at most ${rule.maxLength} characters` });
    }
    
    if (rule.pattern && !rule.pattern.test(value)) {
      errors.push({ field, message: rule.patternMessage || `${field} format is invalid` });
    }
    
    if (rule.custom && !rule.custom(value)) {
      errors.push({ field, message: rule.customMessage || `${field} is invalid` });
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
