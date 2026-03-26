import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Badge } from '@/app/components/ui/badge';
import { Textarea } from '@/app/components/ui/textarea';
import { useApp } from '@/app/context/AppContext';
import { 
  ArrowLeft, 
  Phone, 
  MapPin, 
  Package, 
  Calendar,
  User,
  Image as ImageIcon,
  Clock,
  FileText
} from 'lucide-react';
import { motion } from 'motion/react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Label } from '@/app/components/ui/label';
import { Input } from '@/app/components/ui/input';
import type { Lead, Note } from '@/app/types';
import { toast } from 'sonner';

interface LeadDetailsProps {
  leadId: string;
  onBack: () => void;
  onNavigate: (page: string, leadId?: string) => void;
}

export const LeadDetails: React.FC<LeadDetailsProps> = ({ leadId, onBack, onNavigate }) => {
  const { customers, leads, updateLead, addLead, addNoteToLead, products } = useApp();
  
  const customer = customers.find(c => c.id === leadId);
  const leadInfo = leads.find(l => l.customerId === leadId);

  const [status, setStatus] = useState<Lead['status']>(leadInfo?.status || 'new');
  const [notes, setNotes] = useState(
    leadInfo?.notes.map((note) => note.content).join('\n') || ''
  );
  const [followUpDate, setFollowUpDate] = useState(
    leadInfo?.nextFollowUp ? new Date(leadInfo.nextFollowUp).toISOString().split('T')[0] : ''
  );

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B6B6B]">Lead not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const handleSave = () => {
    if (leadInfo) {
      updateLead(leadInfo.id, {
        status,
        nextFollowUp: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        lastContact: new Date().toISOString(),
      });

      if (notes.trim()) {
        addNoteToLead(leadInfo.id, notes.trim());
      }
    } else {
      const initialNotes: Note[] = notes.trim()
        ? [{ id: `note-${Date.now()}`, content: notes.trim(), createdBy: 'system', createdAt: new Date() }]
        : [];

      addLead({
        customerId: customer.id,
        customerName: customer.name,
        customerPhone: customer.phone,
        customerEmail: customer.email || '',
        customerAddress: customer.address || '',
        status,
        notes: initialNotes,
        callLogs: [],
        nextFollowUp: followUpDate ? new Date(followUpDate).toISOString() : undefined,
        lastContact: new Date().toISOString(),
        estimatedValue: 0,
      });
    }
    toast.success('Lead updated successfully');
  };

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

  // Get product details
  const selectedProducts = customer.selectedProducts?.map(sp => {
    const product = products.find(p => p.id === sp.productId);
    return {
      ...sp,
      productDetails: product,
    };
  }) || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#B8860B] hover:bg-[#FFF8F0]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Leads
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent mb-2">
            {customer.name}
          </h1>
          <p className="text-[#6B6B6B]">Lead Details & Management</p>
        </div>
        <Button
          onClick={() => onNavigate('IVR Call', leadId)}
          className="bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
        >
          <Phone className="w-4 h-4 mr-2" />
          Call Now
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Left Column - Customer Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Information */}
          <Card className="border-[#B8860B]/20">
            <CardHeader>
              <CardTitle className="text-[#B8860B] flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Name</p>
                  <p className="font-semibold text-[#1A1A1A]">{customer.name}</p>
                </div>
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Phone</p>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-[#B8860B]" />
                    <p className="font-semibold text-[#1A1A1A]">{customer.phone}</p>
                  </div>
                </div>
                {customer.location && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-[#6B6B6B] mb-1">Location</p>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-[#B8860B]" />
                      <p className="font-semibold text-[#1A1A1A]">{customer.location}</p>
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-sm text-[#6B6B6B] mb-1">Created</p>
                  <p className="font-semibold text-[#1A1A1A]">
                    {new Date(customer.createdAt).toLocaleDateString()}
                  </p>
                </div>
                {leadInfo?.lastContact && (
                  <div>
                    <p className="text-sm text-[#6B6B6B] mb-1">Last Contact</p>
                    <p className="font-semibold text-[#1A1A1A]">
                      {new Date(leadInfo.lastContact).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selected Products */}
          {selectedProducts.length > 0 && (
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  Selected Products ({selectedProducts.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {selectedProducts.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border border-[#B8860B]/20 bg-gradient-to-r from-[#FFF8F0] to-white"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-semibold text-[#1A1A1A] mb-1">{item.name}</h4>
                          {item.productDetails && (
                            <p className="text-sm text-[#6B6B6B] mb-2">
                              {item.productDetails.category} - ₹{item.productDetails.price.toLocaleString()}
                            </p>
                          )}
                          <div className="flex items-center gap-4 text-sm">
                            <span className="text-[#6B6B6B]">
                              Quantity: <strong className="text-[#1A1A1A]">{item.quantity}</strong>
                            </span>
                            {item.room && (
                              <span className="text-[#6B6B6B]">
                                Room: <strong className="text-[#1A1A1A]">{item.room}</strong>
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* AI Design Images */}
          {customer.aiDesignImages && customer.aiDesignImages.length > 0 && (
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  AI Design Visualizations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {customer.aiDesignImages.map((image, index) => (
                    <div
                      key={index}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-[#B8860B]/20 hover:border-[#B8860B]/40 transition-all cursor-pointer"
                    >
                      <img
                        src={image}
                        alt={`Design ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Right Column - Lead Management */}
        <div className="space-y-6">
          {/* Lead Status Management */}
          <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
            <CardHeader>
              <CardTitle className="text-[#B8860B]">Lead Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="status">Lead Status</Label>
                <Select value={status} onValueChange={(value) => setStatus(value as Lead['status'])}>
                  <SelectTrigger className="border-[#B8860B]/30 focus:border-[#B8860B]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                        New
                      </div>
                    </SelectItem>
                    <SelectItem value="interested">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                        Interested
                      </div>
                    </SelectItem>
                    <SelectItem value="negotiation">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                        Negotiation
                      </div>
                    </SelectItem>
                    <SelectItem value="converted">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span>
                        Converted
                      </div>
                    </SelectItem>
                    <SelectItem value="lost">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-red-500"></span>
                        Lost
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
                <div className="pt-2">
                  <Badge className={getStatusColor(status)}>
                    Current Status: {status}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="followUp">Next Follow-up Date</Label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#B8860B]" />
                  <Input
                    id="followUp"
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="pl-10 border-[#B8860B]/30 focus:border-[#B8860B]"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Add notes about this lead..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="border-[#B8860B]/30 focus:border-[#B8860B] min-h-[120px]"
                />
              </div>

              <Button
                onClick={handleSave}
                className="w-full bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
              >
                Save Changes
              </Button>
            </CardContent>
          </Card>

          {/* Call History */}
          {leadInfo?.callLogs && leadInfo.callLogs.length > 0 && (
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Call History
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {leadInfo.callLogs.slice(0, 5).map((call, index) => (
                    <div
                      key={index}
                      className="p-3 rounded-lg border border-[#B8860B]/10 bg-white"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <Badge
                          className={
                            call.status === 'completed'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                          }
                        >
                          {call.status}
                        </Badge>
                        <span className="text-xs text-[#6B6B6B]">
                          {new Date(call.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-[#6B6B6B]">
                        Duration: {call.duration ? `${call.duration}s` : 'N/A'}
                      </p>
                      {call.notes && (
                        <p className="text-sm text-[#1A1A1A] mt-1">{call.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
