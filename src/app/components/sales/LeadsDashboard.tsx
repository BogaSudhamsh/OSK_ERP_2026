import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Input } from '@/app/components/ui/input';
import { useApp } from '@/app/context/AppContext';
import { 
  Users, 
  Phone, 
  MapPin, 
  Package, 
  Search, 
  Filter,
  TrendingUp,
  Clock,
  CheckCircle2,
  XCircle,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';

interface LeadsDashboardProps {
  onNavigate: (page: string, leadId?: string) => void;
}

export const LeadsDashboard: React.FC<LeadsDashboardProps> = ({ onNavigate }) => {
  const { customers, leads } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Combine customers and leads data
  const allLeads = customers.map(customer => {
    const leadInfo = leads.find(l => l.customerId === customer.id);
    return {
      ...customer,
      status: leadInfo?.status || 'new',
      lastContact: leadInfo?.lastContact,
      nextFollowUp: leadInfo?.nextFollowUp,
    };
  });

  const filteredLeads = allLeads.filter(lead => {
    const matchesSearch = 
      lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      lead.location?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const stats = [
    {
      title: 'Total Leads',
      value: allLeads.length,
      icon: Users,
      color: 'from-[#B8860B] to-[#DAA520]',
      bgColor: 'bg-[#FFF8F0]',
    },
    {
      title: 'Converted',
      value: allLeads.filter(l => l.status === 'converted').length,
      icon: CheckCircle2,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'In Negotiation',
      value: allLeads.filter(l => l.status === 'negotiation').length,
      icon: TrendingUp,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Follow-ups Today',
      value: allLeads.filter(l => {
        if (!l.nextFollowUp) return false;
        const today = new Date().toDateString();
        return new Date(l.nextFollowUp).toDateString() === today;
      }).length,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'interested':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'negotiation':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'converted':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'lost':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent mb-2">
          Leads Dashboard
        </h1>
        <p className="text-[#6B6B6B]">Manage and track customer leads</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`border-[#B8860B]/20 ${stat.bgColor}`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-[#1A1A1A]">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <Card className="border-[#B8860B]/20">
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
              <Input
                placeholder="Search by name, phone, or location..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 border-[#B8860B]/30 focus:border-[#B8860B]"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              {['all', 'new', 'interested', 'negotiation', 'converted', 'lost'].map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  className={
                    statusFilter === status
                      ? 'bg-gradient-to-r from-[#B8860B] to-[#DAA520] text-white'
                      : 'border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]'
                  }
                  size="sm"
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Leads Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredLeads.length === 0 ? (
          <Card className="col-span-full border-[#B8860B]/20">
            <CardContent className="py-16 text-center">
              <Users className="w-16 h-16 mx-auto mb-4 text-[#B8860B]/30" />
              <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No leads found</h3>
              <p className="text-[#6B6B6B]">Try adjusting your filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredLeads.map((lead, index) => (
            <motion.div
              key={lead.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className="border-[#B8860B]/20 hover:border-[#B8860B]/40 hover:shadow-lg transition-all cursor-pointer group">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-[#1A1A1A] mb-1">{lead.name}</CardTitle>
                      <Badge className={getStatusColor(lead.status)}>
                        {lead.status}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Contact Info */}
                  <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                    <Phone className="w-4 h-4 text-[#B8860B]" />
                    <span>{lead.phone}</span>
                  </div>

                  {lead.location && (
                    <div className="flex items-center gap-2 text-sm text-[#6B6B6B]">
                      <MapPin className="w-4 h-4 text-[#B8860B]" />
                      <span>{lead.location}</span>
                    </div>
                  )}

                  {/* Selected Products */}
                  {lead.selectedProducts && lead.selectedProducts.length > 0 && (
                    <div className="pt-2 border-t border-[#B8860B]/10">
                      <div className="flex items-center gap-2 mb-2">
                        <Package className="w-4 h-4 text-[#B8860B]" />
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {lead.selectedProducts.length} Products Selected
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {lead.selectedProducts.slice(0, 3).map((product, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs border-[#B8860B]/30">
                            {product.name}
                          </Badge>
                        ))}
                        {lead.selectedProducts.length > 3 && (
                          <Badge variant="outline" className="text-xs border-[#B8860B]/30">
                            +{lead.selectedProducts.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Follow-up reminder */}
                  {lead.nextFollowUp && (
                    <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-orange-50 border border-orange-200">
                      <Calendar className="w-4 h-4 text-orange-600" />
                      <span className="text-orange-700">
                        Follow-up: {new Date(lead.nextFollowUp).toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => onNavigate('Lead Details', lead.id)}
                      className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
                      size="sm"
                    >
                      View Details
                    </Button>
                    <Button
                      onClick={() => onNavigate('IVR Call', lead.id)}
                      variant="outline"
                      className="border-[#B8860B]/30 text-[#B8860B] hover:bg-[#FFF8F0]"
                      size="sm"
                    >
                      <Phone className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};
