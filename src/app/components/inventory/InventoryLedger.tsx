import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Badge } from '@/app/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, Search, TrendingDown, TrendingUp, Filter, Download, Calendar } from 'lucide-react';
import { motion } from 'motion/react';

interface InventoryLedgerProps {
  onBack: () => void;
}

export const InventoryLedger: React.FC<InventoryLedgerProps> = ({ onBack }) => {
  const { stockMovements, products } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = 
      movement.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (movement.invoiceReference || movement.id).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || movement.type === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const movementDate = new Date(movement.createdAt);
      const today = new Date();
      
      switch (dateFilter) {
        case 'today':
          matchesDate = movementDate.toDateString() === today.toDateString();
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = movementDate >= weekAgo;
          break;
        case 'month':
          matchesDate = movementDate.getMonth() === today.getMonth() && 
                       movementDate.getFullYear() === today.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesType && matchesDate;
  });

  const totalIn = filteredMovements
    .filter(m => m.type === 'in')
    .reduce((sum, m) => sum + m.quantity, 0);
  
  const totalOut = filteredMovements
    .filter(m => m.type === 'out')
    .reduce((sum, m) => sum + m.quantity, 0);

  const handleExport = () => {
    alert('Ledger exported to Excel');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-[#B8860B] hover:bg-[#FFF8F0]"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent">
              Inventory Ledger
            </h1>
            <p className="text-[#6B6B6B]">Complete stock movement history</p>
          </div>
        </div>
        <Button
          onClick={handleExport}
          className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
        >
          <Download className="w-4 h-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid md:grid-cols-3 gap-4">
        <Card className="border-[#B8860B]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Total Stock In</p>
                <p className="text-2xl font-bold text-green-600">{totalIn}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#B8860B]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Total Stock Out</p>
                <p className="text-2xl font-bold text-red-600">{totalOut}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center">
                <TrendingDown className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#B8860B]/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#6B6B6B] mb-1">Total Movements</p>
                <p className="text-2xl font-bold text-[#B8860B]">{filteredMovements.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
                <Calendar className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-[#B8860B]/20">
        <CardHeader>
          <CardTitle className="text-[#B8860B] flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
              <Input
                placeholder="Search product or reference..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#B8860B]/30 focus:border-[#B8860B]"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                <SelectValue placeholder="Movement Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="in">Stock In</SelectItem>
                <SelectItem value="out">Stock Out</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                <SelectValue placeholder="Date Range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Ledger Table */}
      <Card className="border-[#B8860B]/20">
        <CardHeader>
          <CardTitle className="text-[#B8860B]">Movement History</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredMovements.length === 0 ? (
            <div className="text-center py-16">
              <TrendingDown className="w-16 h-16 mx-auto mb-4 text-[#B8860B]/30" />
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No movements found</h3>
              <p className="text-[#6B6B6B]">Try adjusting your filters</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gradient-to-r from-[#FFF8F0] to-white border-b-2 border-[#B8860B]/20">
                  <tr>
                    <th className="text-left p-4 font-semibold text-[#B8860B]">Date & Time</th>
                    <th className="text-left p-4 font-semibold text-[#B8860B]">Product</th>
                    <th className="text-center p-4 font-semibold text-[#B8860B]">Type</th>
                    <th className="text-center p-4 font-semibold text-[#B8860B]">Quantity</th>
                    <th className="text-left p-4 font-semibold text-[#B8860B]">Reference</th>
                    <th className="text-left p-4 font-semibold text-[#B8860B]">Performed By</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMovements.map((movement, index) => (
                    <motion.tr
                      key={movement.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-[#B8860B]/10 hover:bg-[#FFF8F0]/30 transition-colors"
                    >
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">
                            {new Date(movement.createdAt).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-[#6B6B6B]">
                            {new Date(movement.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <p className="font-medium text-[#1A1A1A]">{movement.productName}</p>
                          <p className="text-sm text-[#6B6B6B]">ID: {movement.productId}</p>
                        </div>
                      </td>
                      <td className="p-4 text-center">
                        <Badge
                          className={
                            movement.type === 'in'
                              ? 'bg-green-100 text-green-700 border-green-200'
                              : 'bg-red-100 text-red-700 border-red-200'
                          }
                        >
                          <div className="flex items-center gap-1">
                            {movement.type === 'in' ? (
                              <TrendingUp className="w-3 h-3" />
                            ) : (
                              <TrendingDown className="w-3 h-3" />
                            )}
                            {movement.type === 'in' ? 'Stock In' : 'Stock Out'}
                          </div>
                        </Badge>
                      </td>
                      <td className="p-4 text-center">
                        <span className={`inline-block px-3 py-1 rounded-full font-semibold ${
                          movement.type === 'in'
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-700'
                        }`}>
                          {movement.type === 'in' ? '+' : '-'}{movement.quantity}
                        </span>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-[#1A1A1A]">{movement.invoiceReference || '-'}</p>
                      </td>
                      <td className="p-4">
                        <p className="text-sm text-[#1A1A1A]">{movement.userName}</p>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};