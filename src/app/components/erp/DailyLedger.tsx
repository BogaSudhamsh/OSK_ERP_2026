import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useApp } from '@/app/context/AppContext';
import { DayBookEntry, BranchLocation, PaymentMode } from '@/app/types';

import {
  BookOpen,
  Plus,
  Coffee,
  Car,
  Pencil,
  Sparkles,
  HandCoins,
  HelpCircle,
  IndianRupee,
  CalendarDays,
  Building2,
  ChevronDown,
  ChevronUp,
  TrendingDown,
  TrendingUp,
  Clock,
  Filter,
  X,
  AlertTriangle,
  CheckCircle2,
  ArrowDownLeft,
  ArrowUpRight,
  ShoppingBag,
  Wallet,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface DailyLedgerProps {
  userRole: 'super-admin' | 'branch-admin' | 'stock-manager';
  currentBranchId?: string;
  currentBranchLocation?: string;
}

const SUBCATEGORY_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  'hospitality':  { label: 'Hospitality',  icon: Coffee,            color: 'bg-amber-100 text-amber-700 border-amber-300' },
  'auto-travel':  { label: 'Auto/Travel',  icon: Car,               color: 'bg-purple-100 text-purple-700 border-purple-300' },
  'stationery':   { label: 'Stationery',   icon: Pencil,            color: 'bg-indigo-100 text-indigo-700 border-indigo-300' },
  'cleaning':     { label: 'Cleaning',     icon: Sparkles,          color: 'bg-teal-100 text-teal-700 border-teal-300' },
  'tips':         { label: 'Tips',         icon: HandCoins,         color: 'bg-pink-100 text-pink-700 border-pink-300' },
  'miscellaneous':{ label: 'Misc',         icon: HelpCircle,        color: 'bg-gray-100 text-gray-700 border-gray-300' },
};

// Legacy subcategories that map to 'hospitality'
const LEGACY_HOSPITALITY = ['tea', 'coffee', 'snacks', 'water', 'lunch'];

/** Normalize old tea/coffee/snacks/water/lunch entries to 'hospitality' */
const normalizeSubcategory = (sub: string | undefined): string => {
  if (!sub) return 'miscellaneous';
  if (LEGACY_HOSPITALITY.includes(sub)) return 'hospitality';
  return sub;
};

const FILTER_OPTIONS: { value: string; label: string; icon: React.ElementType }[] = [
  { value: 'all',          label: 'All Types',    icon: Filter },
  { value: 'hospitality',  label: 'Hospitality',  icon: Coffee },
  { value: 'auto-travel',  label: 'Auto/Travel',  icon: Car },
  { value: 'stationery',   label: 'Stationery',   icon: Pencil },
  { value: 'cleaning',     label: 'Cleaning',     icon: Sparkles },
  { value: 'tips',         label: 'Tips',         icon: HandCoins },
  { value: 'miscellaneous',label: 'Misc',         icon: HelpCircle },
];



const formatTime = (date: Date) => {
  return new Date(date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
};

const formatDate = (date: Date) => {
  return new Date(date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

const isSameDay = (d1: Date, d2: Date) => {
  const a = new Date(d1);
  const b = new Date(d2);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
};

export const DailyLedger: React.FC<DailyLedgerProps> = ({ userRole, currentBranchId, currentBranchLocation }) => {
  const { dayBookEntries, addDayBookEntry, branches } = useApp();

  const isSuperAdmin = userRole === 'super-admin';

  // State
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedBranch, setSelectedBranch] = useState<string>(isSuperAdmin ? 'all' : (currentBranchLocation || 'aziz-nagar'));
  const [showAddForm, setShowAddForm] = useState(false);
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [expandedBranch, setExpandedBranch] = useState<string | null>(isSuperAdmin ? null : (currentBranchLocation || null));
  const [ledgerView, setLedgerView] = useState<'all' | 'income' | 'expenses'>('all');

  // Form state
  const [formAmount, setFormAmount] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formSubcategory, setFormSubcategory] = useState<string>('hospitality');
  const [formPaymentMode, setFormPaymentMode] = useState<PaymentMode>('cash');

  // Helper to check subcategory filter match
  const matchesFilter = (subcategory: string | undefined, filter: string): boolean => {
    if (filter === 'all') return true;
    const normalized = normalizeSubcategory(subcategory);
    return normalized === filter;
  };

  // All entries for this date/branch (both income + expenses)
  const allDailyEntries = useMemo(() => {
    const targetDate = new Date(selectedDate);
    return dayBookEntries.filter(entry => {
      const matchesDate = isSameDay(entry.date, targetDate);
      const matchesBranch = selectedBranch === 'all' || entry.branchLocation === selectedBranch;
      // Only show sales (income) and refreshments (expenses)
      const isRelevant = entry.category === 'sales' || entry.category === 'refreshments';
      return matchesDate && matchesBranch && isRelevant;
    }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }, [dayBookEntries, selectedDate, selectedBranch]);

  // Filtered by view tab + subcategory
  const dailyEntries = useMemo(() => {
    return allDailyEntries.filter(entry => {
      const viewMatch = ledgerView === 'all'
        ? true
        : ledgerView === 'income'
          ? entry.type === 'credit'
          : entry.type === 'debit';
      const subcatMatch = entry.type === 'credit'
        ? filterSubcategory === 'all' // subcategory filter doesn't apply to income
        : matchesFilter(entry.subcategory, filterSubcategory);
      return viewMatch && subcatMatch;
    });
  }, [allDailyEntries, ledgerView, filterSubcategory]);

  // Income & expense totals
  const incomeToday = allDailyEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0);
  const expenseToday = allDailyEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0);
  const netToday = incomeToday - expenseToday;
  const entryCount = dailyEntries.length;
  const totalToday = dailyEntries.reduce((sum, e) => sum + e.amount, 0);

  // Group by branch for super admin view
  const entriesByBranch = useMemo(() => {
    const targetDate = new Date(selectedDate);
    const grouped: Record<string, DayBookEntry[]> = {};
    const branchLocs = selectedBranch === 'all' ? ['aziz-nagar', 'vikarabad', 'sangareddy'] : [selectedBranch];
    branchLocs.forEach(loc => {
      grouped[loc] = dayBookEntries.filter(entry => {
        const matchesDate = isSameDay(entry.date, targetDate);
        const matchesBranch = entry.branchLocation === loc;
        const isRelevant = entry.category === 'sales' || entry.category === 'refreshments';
        const viewMatch = ledgerView === 'all'
          ? true
          : ledgerView === 'income'
            ? entry.type === 'credit'
            : entry.type === 'debit';
        const subcatMatch = entry.type === 'credit'
          ? filterSubcategory === 'all'
          : matchesFilter(entry.subcategory, filterSubcategory);
        return matchesDate && matchesBranch && isRelevant && viewMatch && subcatMatch;
      }).sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });
    return grouped;
  }, [dayBookEntries, selectedDate, selectedBranch, ledgerView, filterSubcategory]);

  // Per-branch income/expense totals
  const branchSummary = useMemo(() => {
    const targetDate = new Date(selectedDate);
    const summary: Record<string, { income: number; expense: number; entries: number }> = {};
    ['aziz-nagar', 'vikarabad', 'sangareddy'].forEach(loc => {
      const branchEntries = dayBookEntries.filter(e =>
        isSameDay(e.date, targetDate) &&
        e.branchLocation === loc &&
        (e.category === 'sales' || e.category === 'refreshments')
      );
      summary[loc] = {
        income: branchEntries.filter(e => e.type === 'credit').reduce((sum, e) => sum + e.amount, 0),
        expense: branchEntries.filter(e => e.type === 'debit').reduce((sum, e) => sum + e.amount, 0),
        entries: branchEntries.length,
      };
    });
    return summary;
  }, [dayBookEntries, selectedDate]);

  const grandIncome = Object.values(branchSummary).reduce((a, b) => a + b.income, 0);
  const grandExpense = Object.values(branchSummary).reduce((a, b) => a + b.expense, 0);
  const grandNet = grandIncome - grandExpense;

  // Expense category breakdown (only for debits)
  const categoryBreakdown = useMemo(() => {
    const expenseEntries = allDailyEntries.filter(e => e.type === 'debit');
    const breakdown: Record<string, number> = {};
    expenseEntries.forEach(e => {
      const key = normalizeSubcategory(e.subcategory);
      breakdown[key] = (breakdown[key] || 0) + e.amount;
    });
    return Object.entries(breakdown).sort((a, b) => b[1] - a[1]);
  }, [allDailyEntries]);

  const handleAddEntry = () => {
    const amount = parseFloat(formAmount);
    if (!amount || amount <= 0) {
      toast.error('Please enter a valid amount (even ₹1 counts!)');
      return;
    }
    if (!formDescription.trim()) {
      toast.error('Please add a description');
      return;
    }

    const branchLoc = isSuperAdmin ? selectedBranch : (currentBranchLocation || 'aziz-nagar');
    if (branchLoc === 'all') {
      toast.error('Please select a specific branch');
      return;
    }

    const branch = branches.find(b => b.location === branchLoc);
    const targetDate = new Date(selectedDate);

    addDayBookEntry({
      branchId: branch?.id || 'branch-1',
      branchLocation: branchLoc as BranchLocation,
      date: targetDate,
      description: formDescription.trim(),
      type: 'debit',
      amount,
      paymentMode: formPaymentMode,
      category: 'refreshments',
      subcategory: formSubcategory as any,
      runningBalance: 0, // Will be calculated
      enteredBy: branch?.manager || 'Branch Admin',
    });

    toast.success(
      <div className="flex items-center gap-2">
        <CheckCircle2 className="w-4 h-4 text-green-500" />
        <span>₹{amount} recorded for {SUBCATEGORY_CONFIG[formSubcategory]?.label || formSubcategory}</span>
      </div>
    );

    // Reset form
    setFormAmount('');
    setFormDescription('');
    setFormSubcategory('hospitality');
    setShowAddForm(false);
  };

  const quickAdd = (subcat: string) => {
    setFormSubcategory(subcat);
    setShowAddForm(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-[#B8860B]" />
            Daily Ledger
          </h1>
          <p className="text-[#6B6B6B] mt-1">
            {isSuperAdmin ? 'Track every rupee spent across all branches' : 'Record daily expenses — every rupee counts'}
          </p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white shadow-lg"
        >
          {showAddForm ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
          {showAddForm ? 'Cancel' : 'Add Expense'}
        </Button>
      </div>

      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 bg-white border border-[#B8860B]/20 rounded-lg px-3 py-2">
          <CalendarDays className="w-4 h-4 text-[#B8860B]" />
          <Input
            type="date"
            value={selectedDate}
            onChange={e => setSelectedDate(e.target.value)}
            className="border-none p-0 h-auto text-sm w-[140px] focus:ring-0"
          />
        </div>

        {isSuperAdmin && (
          <div className="flex items-center gap-2 bg-white border border-[#B8860B]/20 rounded-lg px-3 py-1">
            <Building2 className="w-4 h-4 text-[#B8860B]" />
            <Select value={selectedBranch} onValueChange={setSelectedBranch}>
              <SelectTrigger className="border-none p-0 h-auto text-sm w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Branches</SelectItem>
                <SelectItem value="aziz-nagar">Aziz Nagar</SelectItem>
                <SelectItem value="vikarabad">Vikarabad</SelectItem>
                <SelectItem value="sangareddy">Sangareddy</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-2 bg-white border border-[#B8860B]/20 rounded-lg px-3 py-1">
          <Filter className="w-4 h-4 text-[#B8860B]" />
          <Select value={filterSubcategory} onValueChange={setFilterSubcategory}>
            <SelectTrigger className="border-none p-0 h-auto text-sm w-[130px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {FILTER_OPTIONS.map(opt => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Quick Add Form */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-2 border-[#B8860B]/30 shadow-lg">
              <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10 pb-4">
                <CardTitle className="text-[#B8860B] flex items-center gap-2 text-lg">
                  <Plus className="w-5 h-5" />
                  Record Expense
                </CardTitle>
                <p className="text-xs text-[#6B6B6B] mt-1">Even ₹1 should not be missed — every paisa matters!</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Quick Category Chips */}
                <div>
                  <Label className="text-xs text-[#6B6B6B] mb-2 block">Quick Select Category</Label>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(SUBCATEGORY_CONFIG).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const isSelected = formSubcategory === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setFormSubcategory(key)}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                            isSelected
                              ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white border-[#B8860B] shadow-md'
                              : `${cfg.color} hover:shadow-sm`
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {cfg.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Amount (₹) <span className="text-[#B8860B]">*</span></Label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#B8860B]" />
                      <Input
                        type="number"
                        min="1"
                        step="1"
                        value={formAmount}
                        onChange={e => setFormAmount(e.target.value)}
                        placeholder="Even ₹1"
                        className="pl-9 border-[#B8860B]/30 focus:border-[#B8860B] text-lg"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Payment Mode</Label>
                    <Select value={formPaymentMode} onValueChange={v => setFormPaymentMode(v as PaymentMode)}>
                      <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cash">Cash</SelectItem>
                        <SelectItem value="upi">UPI</SelectItem>
                        <SelectItem value="bank">Bank</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {isSuperAdmin && selectedBranch === 'all' && (
                    <div className="space-y-2">
                      <Label>Branch <span className="text-[#B8860B]">*</span></Label>
                      <Select value="" onValueChange={v => setSelectedBranch(v)}>
                        <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                          <SelectValue placeholder="Select branch" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="aziz-nagar">Aziz Nagar</SelectItem>
                          <SelectItem value="vikarabad">Vikarabad</SelectItem>
                          <SelectItem value="sangareddy">Sangareddy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Description <span className="text-[#B8860B]">*</span></Label>
                  <Textarea
                    value={formDescription}
                    onChange={e => setFormDescription(e.target.value)}
                    placeholder="e.g., Tea for Mr. Ramesh (customer visit), Coffee + biscuits for 3 customers..."
                    rows={2}
                    className="border-[#B8860B]/30 focus:border-[#B8860B] resize-none"
                  />
                </div>

                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setShowAddForm(false)} className="border-[#B8860B]/30 text-[#B8860B]">
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddEntry}
                    className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#DAA520] hover:to-[#B8860B] text-white px-8"
                  >
                    <IndianRupee className="w-4 h-4 mr-1" />
                    Record ₹{formAmount || '0'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary Cards */}
      {isSuperAdmin ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Income */}
          <Card className="border-2 border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B6B6B] flex items-center gap-1"><ArrowDownLeft className="w-3 h-3 text-emerald-600" />Income (Orders)</p>
                  <p className="text-2xl font-bold text-emerald-600">₹{grandIncome.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Expenses */}
          <Card className="border-2 border-amber-300/50 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B6B6B] flex items-center gap-1"><ArrowUpRight className="w-3 h-3 text-amber-600" />Expenses</p>
                  <p className="text-2xl font-bold text-amber-600">₹{grandExpense.toLocaleString('en-IN')}</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-amber-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-amber-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Net Balance */}
          <Card className={`border-2 ${grandNet >= 0 ? 'border-[#B8860B]/30 bg-gradient-to-br from-[#FFF8F0] to-white' : 'border-orange-300/50 bg-gradient-to-br from-orange-50 to-white'}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B6B6B] flex items-center gap-1"><Wallet className="w-3 h-3 text-[#B8860B]" />Net Balance</p>
                  <p className={`text-2xl font-bold ${grandNet >= 0 ? 'text-[#B8860B]' : 'text-orange-600'}`}>₹{grandNet.toLocaleString('en-IN')}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">{formatDate(new Date(selectedDate))}</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center shadow-lg">
                  <IndianRupee className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Total Entries */}
          <Card className="border border-[#B8860B]/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-[#6B6B6B]">Total Entries</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{allDailyEntries.length}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">across {selectedBranch === 'all' ? 'all branches' : branches.find(b => b.location === selectedBranch)?.name}</p>
                </div>
                <div className="w-11 h-11 rounded-full bg-[#FFF8F0] flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-[#B8860B]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-2 border-emerald-300/50 bg-gradient-to-br from-emerald-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-[#6B6B6B] flex items-center justify-center gap-1"><ArrowDownLeft className="w-3 h-3 text-emerald-600" />Income</p>
              <p className="text-2xl font-bold text-emerald-600">₹{incomeToday.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card className="border-2 border-amber-300/50 bg-gradient-to-br from-amber-50 to-white">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-[#6B6B6B] flex items-center justify-center gap-1"><ArrowUpRight className="w-3 h-3 text-amber-600" />Expenses</p>
              <p className="text-2xl font-bold text-amber-600">₹{expenseToday.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card className={`border-2 ${netToday >= 0 ? 'border-[#B8860B]/30 bg-gradient-to-br from-[#FFF8F0] to-white' : 'border-orange-300/50 bg-gradient-to-br from-orange-50 to-white'}`}>
            <CardContent className="p-4 text-center">
              <p className="text-xs text-[#6B6B6B]">Net Balance</p>
              <p className={`text-2xl font-bold ${netToday >= 0 ? 'text-[#B8860B]' : 'text-orange-600'}`}>₹{netToday.toLocaleString('en-IN')}</p>
            </CardContent>
          </Card>
          <Card className="border border-[#B8860B]/20">
            <CardContent className="p-4 text-center">
              <p className="text-xs text-[#6B6B6B]">Entries</p>
              <p className="text-2xl font-bold text-[#1A1A1A]">{allDailyEntries.length}</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Ledger View Toggle */}
      <div className="flex items-center gap-2">
        {(['all', 'income', 'expenses'] as const).map(view => {
          const isActive = ledgerView === view;
          const labels = { all: 'All', income: 'Income', expenses: 'Expenses' };
          const icons = { all: BookOpen, income: ArrowDownLeft, expenses: ArrowUpRight };
          const ViewIcon = icons[view];
          return (
            <button
              key={view}
              onClick={() => setLedgerView(view)}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold border transition-all ${
                isActive
                  ? view === 'income'
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm'
                    : view === 'expenses'
                      ? 'bg-amber-100 text-amber-700 border-amber-300 shadow-sm'
                      : 'bg-gradient-to-r from-[#B8860B]/15 to-[#DAA520]/15 text-[#B8860B] border-[#B8860B]/30 shadow-sm'
                  : 'bg-white text-[#6B6B6B] border-[#B8860B]/15 hover:bg-[#FFF8F0]'
              }`}
            >
              <ViewIcon className="w-4 h-4" />
              {labels[view]}
              {view === 'income' && <span className="text-xs ml-1">({allDailyEntries.filter(e => e.type === 'credit').length})</span>}
              {view === 'expenses' && <span className="text-xs ml-1">({allDailyEntries.filter(e => e.type === 'debit').length})</span>}
            </button>
          );
        })}
      </div>

      {/* Category Breakdown */}
      {categoryBreakdown.length > 0 && (
        <Card className="border border-[#B8860B]/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-[#B8860B] flex items-center gap-2">
              <TrendingDown className="w-4 h-4" />
              Expense Breakdown by Category
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="flex flex-wrap gap-2">
              {categoryBreakdown.map(([key, amount]) => {
                const cfg = SUBCATEGORY_CONFIG[key];
                const Icon = cfg?.icon || HelpCircle;
                const pct = totalToday > 0 ? ((amount / totalToday) * 100).toFixed(0) : '0';
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm ${cfg?.color || 'bg-gray-100 text-gray-700 border-gray-300'}`}
                  >
                    <Icon className="w-4 h-4" />
                    <span className="font-medium">{cfg?.label || key}</span>
                    <span className="font-bold">₹{amount.toLocaleString('en-IN')}</span>
                    <span className="text-xs opacity-70">({pct}%)</span>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries List */}
      {isSuperAdmin && selectedBranch === 'all' ? (
        // Super Admin: Grouped by branch
        <div className="space-y-4">
          {['aziz-nagar', 'vikarabad', 'sangareddy'].map(loc => {
            const branchEntries = entriesByBranch[loc] || [];
            const branchTotal = branchEntries.reduce((sum, e) => sum + e.amount, 0);
            const isExpanded = expandedBranch === loc;

            return (
              <Card key={loc} className="border border-[#B8860B]/20 overflow-hidden">
                <button
                  onClick={() => setExpandedBranch(isExpanded ? null : loc)}
                  className="w-full flex items-center justify-between p-4 hover:bg-[#FFF8F0]/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center text-white font-bold text-sm">
                      {(branches.find(b => b.location === loc)?.name || loc).replace('OSK Granite - ', '').charAt(0)}
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-[#1A1A1A]">{branches.find(b => b.location === loc)?.name?.replace('OSK Granite - ', '') || loc}</p>
                      <p className="text-xs text-[#6B6B6B]">{branchEntries.length} entries</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-[#B8860B] text-lg">₹{branchTotal.toLocaleString('en-IN')}</p>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-[#B8860B]" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#6B6B6B]" />
                    )}
                  </div>
                </button>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden border-t border-[#B8860B]/10"
                    >
                      {branchEntries.length === 0 ? (
                        <div className="p-8 text-center text-[#6B6B6B]">
                          <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
                          <p>No entries recorded for this date</p>
                        </div>
                      ) : (
                        <div className="divide-y divide-[#B8860B]/10">
                          {branchEntries.map((entry, idx) => (
                            <EntryRow key={entry.id} entry={entry} index={idx} />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            );
          })}
        </div>
      ) : (
        // Single branch view
        <Card className="border border-[#B8860B]/20">
          <CardHeader className="bg-gradient-to-br from-[#FFF8F0] to-white border-b border-[#B8860B]/10">
            <CardTitle className="text-[#B8860B] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span>Expense Timeline — {formatDate(new Date(selectedDate))}</span>
              </div>
              <Badge className="bg-[#B8860B]/10 text-[#B8860B] border border-[#B8860B]/30">
                {dailyEntries.length} entries • ₹{totalToday.toLocaleString('en-IN')}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {dailyEntries.length === 0 ? (
              <div className="p-12 text-center">
                <BookOpen className="w-16 h-16 text-[#B8860B]/20 mx-auto mb-4" />
                <p className="text-[#6B6B6B] text-lg">No expenses recorded for this date</p>
                <p className="text-[#6B6B6B]/60 text-sm mt-1">Click "Add Expense" to start tracking</p>
              </div>
            ) : (
              <div className="divide-y divide-[#B8860B]/10">
                {dailyEntries.map((entry, idx) => (
                  <EntryRow key={entry.id} entry={entry} index={idx} />
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Important Note */}
      <div className="flex items-start gap-3 p-4 bg-[#FFF8F0] rounded-lg border border-[#B8860B]/20">
        <AlertTriangle className="w-5 h-5 text-[#B8860B] flex-shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-[#1A1A1A]">Every rupee matters!</p>
          <p className="text-xs text-[#6B6B6B] mt-0.5">
            Whether it's ₹1 for a candy or ₹500 for lunch — record everything. Customers visit daily, and the tea/coffee/snacks offered add up.
            {isSuperAdmin && ' As Super Admin, you can see all branches\' daily spending at a glance.'}
          </p>
        </div>
      </div>
    </div>
  );
};

// Individual entry row
const EntryRow: React.FC<{ entry: DayBookEntry; index: number }> = ({ entry, index }) => {
  const isIncome = entry.type === 'credit';
  const normalized = normalizeSubcategory(entry.subcategory);
  const cfg = isIncome
    ? { label: 'Sales', icon: ShoppingBag, color: 'bg-emerald-100 text-emerald-700 border-emerald-300' }
    : (SUBCATEGORY_CONFIG[normalized] || SUBCATEGORY_CONFIG['miscellaneous']);
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      className={`flex items-center gap-4 px-4 py-3 transition-colors group ${isIncome ? 'hover:bg-emerald-50/50 bg-emerald-50/20' : 'hover:bg-[#FFF8F0]/50'}`}
    >
      {/* Time */}
      <div className="w-16 flex-shrink-0 text-center">
        <p className="text-xs text-[#6B6B6B]">{formatTime(entry.createdAt)}</p>
      </div>

      {/* Type indicator */}
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.color}`}>
        <Icon className="w-4 h-4" />
      </div>

      {/* Description */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[#1A1A1A] truncate">{entry.description}</p>
        <div className="flex items-center gap-2 mt-0.5">
          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border ${cfg.color}`}>
            {cfg.label}
          </Badge>
          <span className="text-[10px] text-[#6B6B6B] uppercase">{entry.paymentMode}</span>
          {entry.orderId && <span className="text-[10px] text-emerald-600 font-semibold">{entry.orderId}</span>}
          <span className="text-[10px] text-[#6B6B6B]">by {entry.enteredBy}</span>
        </div>
      </div>

      {/* Amount */}
      <div className="flex-shrink-0 text-right">
        <p className={`font-bold text-lg ${isIncome ? 'text-emerald-600' : 'text-amber-600'}`}>
          {isIncome ? '+' : '-'}₹{entry.amount.toLocaleString('en-IN')}
        </p>
        {isIncome && entry.description.includes('[PARTIAL]') && (
          <p className="text-[10px] text-amber-500 font-semibold">PARTIAL PAYMENT</p>
        )}
        {isIncome && entry.description.includes('[PAID]') && (
          <p className="text-[10px] text-emerald-500 font-semibold">FULLY PAID</p>
        )}
      </div>
    </motion.div>
  );
};