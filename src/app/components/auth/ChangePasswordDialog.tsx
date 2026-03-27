import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Button } from '@/app/components/ui/button';
import { Eye, EyeOff, Lock, AlertCircle, CheckCircle2, Users, KeyRound } from 'lucide-react';
import { toast } from 'sonner';
import { resetUserPassword } from '@/app/services/authService';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type TabType = 'self' | 'reset';

export const ChangePasswordDialog: React.FC<ChangePasswordDialogProps> = ({ open, onOpenChange }) => {
  const { changePassword, currentUser } = useApp();
  const isSuperAdmin = currentUser?.role === 'super-admin';

  const [tab, setTab] = useState<TabType>('self');

  // Self change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  // Reset user password state (super-admin)
  const [targetEmail, setTargetEmail] = useState('');
  const [targetNewPass, setTargetNewPass] = useState('');
  const [showTargetNew, setShowTargetNew] = useState(false);

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const reset = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setShowCurrent(false);
    setShowNew(false);
    setTargetEmail('');
    setTargetNewPass('');
    setShowTargetNew(false);
    setError('');
    setIsLoading(false);
    setTab('self');
  };

  const handleClose = (val: boolean) => {
    if (!val) reset();
    onOpenChange(val);
  };

  // Self change
  const handleSelfSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentPassword) { setError('Current password is required.'); return; }
    if (newPassword.length < 6) { setError('New password must be at least 6 characters.'); return; }
    if (newPassword !== confirmPassword) { setError('New passwords do not match.'); return; }
    if (currentPassword === newPassword) { setError('New password must be different from current password.'); return; }

    setIsLoading(true);
    const result = await changePassword(currentPassword, newPassword);
    setIsLoading(false);

    if (result.success) {
      toast.success('Password changed successfully!');
      handleClose(false);
    } else {
      setError(result.error || 'Failed to change password.');
    }
  };

  // Admin reset
  const handleResetSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!targetEmail.trim()) { setError('User email is required.'); return; }
    if (targetNewPass.length < 6) { setError('New password must be at least 6 characters.'); return; }

    setIsLoading(true);
    const result = await resetUserPassword(targetEmail, targetNewPass);
    setIsLoading(false);

    if (result.success) {
      toast.success(`Password reset for ${targetEmail}!`);
      handleClose(false);
    } else {
      setError(result.error || 'Failed to reset password.');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[460px] bg-gradient-to-br from-white via-[#FFF8F0] to-[#FFE4B5]/20 border-[#B8860B]/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#B8860B]">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center shadow-lg shadow-[#B8860B]/20">
              <Lock className="w-4 h-4 text-white" />
            </div>
            Password Management
          </DialogTitle>
        </DialogHeader>

        {/* Tabs — only show for super-admin */}
        {isSuperAdmin && (
          <div className="flex gap-2 mt-1">
            <button
              onClick={() => { setTab('self'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === 'self'
                  ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg shadow-[#B8860B]/20'
                  : 'text-[#6B6B6B] hover:text-[#B8860B] hover:bg-[#FFF8F0] border border-[#B8860B]/10'
              }`}
            >
              <KeyRound className="w-4 h-4" />
              Change My Password
            </button>
            <button
              onClick={() => { setTab('reset'); setError(''); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all ${
                tab === 'reset'
                  ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white shadow-lg shadow-[#B8860B]/20'
                  : 'text-[#6B6B6B] hover:text-[#B8860B] hover:bg-[#FFF8F0] border border-[#B8860B]/10'
              }`}
            >
              <Users className="w-4 h-4" />
              Reset User Password
            </button>
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm mt-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {/* ─── Tab: Change My Password ─── */}
        {tab === 'self' && (
          <form onSubmit={handleSelfSubmit} className="space-y-4 mt-2">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A] text-sm font-medium">Current Password</Label>
              <div className="relative">
                <Input
                  type={showCurrent ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="bg-white border-[#B8860B]/20 text-[#1A1A1A] pr-10 focus:border-[#B8860B] focus:ring-[#B8860B]/20"
                  placeholder="Enter current password"
                />
                <button type="button" onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8860B]/40 hover:text-[#B8860B]">
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] text-sm font-medium">New Password</Label>
              <div className="relative">
                <Input
                  type={showNew ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="bg-white border-[#B8860B]/20 text-[#1A1A1A] pr-10 focus:border-[#B8860B] focus:ring-[#B8860B]/20"
                  placeholder="At least 6 characters"
                />
                <button type="button" onClick={() => setShowNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8860B]/40 hover:text-[#B8860B]">
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] text-sm font-medium">Confirm New Password</Label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="bg-white border-[#B8860B]/20 text-[#1A1A1A] focus:border-[#B8860B] focus:ring-[#B8860B]/20"
                placeholder="Re-enter new password"
              />
              {confirmPassword && newPassword === confirmPassword && (
                <div className="flex items-center gap-1 text-green-600 text-xs">
                  <CheckCircle2 className="w-3 h-3" /> Passwords match
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}
                className="flex-1 border-[#B8860B]/20 text-[#B8860B] hover:bg-[#FFF8F0]">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white font-semibold hover:from-[#DAA520] hover:to-[#B8860B] shadow-lg shadow-[#B8860B]/20">
                {isLoading ? 'Changing...' : 'Change Password'}
              </Button>
            </div>
          </form>
        )}

        {/* ─── Tab: Reset User Password (Super Admin only) ─── */}
        {tab === 'reset' && isSuperAdmin && (
          <form onSubmit={handleResetSubmit} className="space-y-4 mt-2">
            <div className="p-3 rounded-xl bg-[#FFF8F0] border border-[#B8860B]/15 text-[#6B6B6B] text-xs">
              Enter the user's email and a new password. This uses a secure server-side reset — no old password needed.
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] text-sm font-medium">User Email</Label>
              <Input
                type="email"
                value={targetEmail}
                onChange={e => setTargetEmail(e.target.value)}
                className="bg-white border-[#B8860B]/20 text-[#1A1A1A] focus:border-[#B8860B] focus:ring-[#B8860B]/20"
                placeholder="e.g. aziz@oskgranite.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] text-sm font-medium">New Password for User</Label>
              <div className="relative">
                <Input
                  type={showTargetNew ? 'text' : 'password'}
                  value={targetNewPass}
                  onChange={e => setTargetNewPass(e.target.value)}
                  className="bg-white border-[#B8860B]/20 text-[#1A1A1A] pr-10 focus:border-[#B8860B] focus:ring-[#B8860B]/20"
                  placeholder="At least 6 characters"
                />
                <button type="button" onClick={() => setShowTargetNew(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#B8860B]/40 hover:text-[#B8860B]">
                  {showTargetNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => handleClose(false)}
                className="flex-1 border-[#B8860B]/20 text-[#B8860B] hover:bg-[#FFF8F0]">
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white font-semibold hover:from-[#DAA520] hover:to-[#B8860B] shadow-lg shadow-[#B8860B]/20">
                {isLoading ? 'Resetting...' : 'Reset Password'}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
