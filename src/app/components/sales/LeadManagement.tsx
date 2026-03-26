import React, { useState } from 'react';
import { useApp } from '@/app/context/AppContext';
import { Button } from '@/app/components/ui/button';
import { Input } from '@/app/components/ui/input';
import { Label } from '@/app/components/ui/label';
import { Textarea } from '@/app/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/app/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/components/ui/select';
import { Badge } from '@/app/components/ui/badge';
import { Separator } from '@/app/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/components/ui/tabs';
import { Phone, Mail, MapPin, Plus, PhoneCall, FileText, Calendar, User, TrendingUp, DollarSign } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';

export const LeadManagement: React.FC = () => {
  const { leads, updateLead, addNoteToLead, addCallLogToLead, currentUser } = useApp();
  const [selectedLead, setSelectedLead] = useState<string | null>(null);
  const [showCallDialog, setShowCallDialog] = useState(false);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [callData, setCallData] = useState({
    duration: '',
    notes: '',
    status: 'completed' as 'completed' | 'missed' | 'rejected',
  });

  const statusColors = {
    new: 'bg-blue-500',
    contacted: 'bg-purple-500',
    qualified: 'bg-yellow-500',
    proposal: 'bg-orange-500',
    negotiation: 'bg-pink-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
  };

  const statusCounts = {
    new: leads.filter(l => l.status === 'new').length,
    contacted: leads.filter(l => l.status === 'contacted').length,
    qualified: leads.filter(l => l.status === 'qualified').length,
    proposal: leads.filter(l => l.status === 'proposal').length,
    negotiation: leads.filter(l => l.status === 'negotiation').length,
    won: leads.filter(l => l.status === 'won').length,
    lost: leads.filter(l => l.status === 'lost').length,
  };

  const handleStatusChange = (leadId: string, status: any) => {
    updateLead(leadId, { status });
    toast.success('Lead status updated');
  };

  const handleAddNote = () => {
    if (!selectedLead || !noteText.trim()) return;
    addNoteToLead(selectedLead, noteText);
    toast.success('Note added successfully');
    setNoteText('');
    setShowNoteDialog(false);
  };

  const handleAddCall = () => {
    if (!selectedLead || !currentUser) return;
    addCallLogToLead(selectedLead, {
      type: 'outgoing',
      duration: parseInt(callData.duration) || 0,
      status: callData.status,
      notes: callData.notes,
      createdBy: currentUser.id,
    });
    toast.success('Call log added successfully');
    setCallData({ duration: '', notes: '', status: 'completed' });
    setShowCallDialog(false);
  };

  const handleIVRCall = (lead: any) => {
    setSelectedLead(lead.id);
    setShowCallDialog(true);
    // Simulate IVR integration
    toast.success(`Initiating call to ${lead.customerName}...`);
  };

  const lead = selectedLead ? leads.find(l => l.id === selectedLead) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Lead Management</h2>
          <p className="text-slate-600 mt-1">Track and manage sales leads</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        {Object.entries(statusCounts).map(([status, count]) => (
          <Card key={status}>
            <CardContent className="p-4">
              <div className={`w-3 h-3 rounded-full ${statusColors[status as keyof typeof statusColors]} mb-2`}></div>
              <div className="text-2xl font-bold mb-1">{count}</div>
              <p className="text-xs text-slate-600 capitalize">{status}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="flex-wrap h-auto">
          <TabsTrigger value="all">All Leads ({leads.length})</TabsTrigger>
          <TabsTrigger value="new">New ({statusCounts.new})</TabsTrigger>
          <TabsTrigger value="active">Active ({statusCounts.contacted + statusCounts.qualified + statusCounts.proposal})</TabsTrigger>
          <TabsTrigger value="won">Won ({statusCounts.won})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-3">
          {leads.map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={index}
              onStatusChange={handleStatusChange}
              onCall={() => handleIVRCall(lead)}
              onViewDetails={() => setSelectedLead(lead.id)}
              onAddNote={() => {
                setSelectedLead(lead.id);
                setShowNoteDialog(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="new" className="space-y-3">
          {leads.filter(l => l.status === 'new').map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={index}
              onStatusChange={handleStatusChange}
              onCall={() => handleIVRCall(lead)}
              onViewDetails={() => setSelectedLead(lead.id)}
              onAddNote={() => {
                setSelectedLead(lead.id);
                setShowNoteDialog(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="active" className="space-y-3">
          {leads.filter(l => ['contacted', 'qualified', 'proposal', 'negotiation'].includes(l.status)).map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={index}
              onStatusChange={handleStatusChange}
              onCall={() => handleIVRCall(lead)}
              onViewDetails={() => setSelectedLead(lead.id)}
              onAddNote={() => {
                setSelectedLead(lead.id);
                setShowNoteDialog(true);
              }}
            />
          ))}
        </TabsContent>

        <TabsContent value="won" className="space-y-3">
          {leads.filter(l => l.status === 'won').map((lead, index) => (
            <LeadCard
              key={lead.id}
              lead={lead}
              index={index}
              onStatusChange={handleStatusChange}
              onCall={() => handleIVRCall(lead)}
              onViewDetails={() => setSelectedLead(lead.id)}
              onAddNote={() => {
                setSelectedLead(lead.id);
                setShowNoteDialog(true);
              }}
            />
          ))}
        </TabsContent>
      </Tabs>

      {/* Lead Details Dialog */}
      <Dialog open={selectedLead !== null && !showCallDialog && !showNoteDialog} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Lead Details - {lead?.id || 'Loading'}</DialogTitle>
            <DialogDescription>{lead?.customerName || 'Lead information'}</DialogDescription>
          </DialogHeader>
          {lead && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Customer Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-slate-500" />
                      <span className="font-medium">{lead.customerName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="h-4 w-4 text-slate-500" />
                      <span>{lead.customerPhone}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-slate-500" />
                      <span className="truncate">{lead.customerEmail}</span>
                    </div>
                    <div className="flex items-start gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-slate-500 mt-0.5" />
                      <span>{lead.customerAddress}</span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Lead Information</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Status</span>
                      <Badge className={statusColors[lead.status as keyof typeof statusColors]}>
                        {lead.status}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Estimated Value</span>
                      <span className="font-semibold text-green-600">
                        ₹{lead.estimatedValue.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Created</span>
                      <span className="text-sm">{lead.createdAt.toLocaleDateString()}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-600">Last Updated</span>
                      <span className="text-sm">{lead.updatedAt.toLocaleDateString()}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Call History</CardTitle>
                    <Button size="sm" onClick={() => setShowCallDialog(true)}>
                      <PhoneCall className="h-4 w-4 mr-2" />
                      Log Call
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {lead.callLogs.length === 0 ? (
                    <p className="text-sm text-slate-600">No calls logged yet</p>
                  ) : (
                    <div className="space-y-3">
                      {lead.callLogs.map((call) => (
                        <div key={call.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                          <PhoneCall className="h-4 w-4 text-slate-500 mt-0.5" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="secondary" className="text-xs">
                                {call.type}
                              </Badge>
                              <span className="text-xs text-slate-600">
                                {Math.floor(call.duration / 60)}m {call.duration % 60}s
                              </span>
                              <span className="text-xs text-slate-600">•</span>
                              <span className="text-xs text-slate-600">
                                {call.createdAt.toLocaleString()}
                              </span>
                            </div>
                            <p className="text-sm">{call.notes}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Notes</CardTitle>
                    <Button size="sm" onClick={() => setShowNoteDialog(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Note
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {lead.notes.length === 0 ? (
                    <p className="text-sm text-slate-600">No notes yet</p>
                  ) : (
                    <div className="space-y-3">
                      {lead.notes.map((note) => (
                        <div key={note.id} className="p-3 bg-slate-50 rounded-lg">
                          <p className="text-sm mb-2">{note.content}</p>
                          <p className="text-xs text-slate-600">
                            {note.createdAt.toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Call Dialog */}
      <Dialog open={showCallDialog} onOpenChange={setShowCallDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Call</DialogTitle>
            <DialogDescription>Record call details with {lead?.customerName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Call Duration (seconds)</Label>
              <Input
                type="number"
                value={callData.duration}
                onChange={(e) => setCallData({ ...callData, duration: e.target.value })}
                placeholder="180"
              />
            </div>
            <div className="space-y-2">
              <Label>Call Status</Label>
              <Select value={callData.status} onValueChange={(value: any) => setCallData({ ...callData, status: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="missed">Missed</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Call Notes</Label>
              <Textarea
                value={callData.notes}
                onChange={(e) => setCallData({ ...callData, notes: e.target.value })}
                rows={3}
                placeholder="What was discussed?"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowCallDialog(false)}>Cancel</Button>
              <Button onClick={handleAddCall} className="bg-gradient-to-r from-orange-500 to-red-500">
                Save Call Log
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Note</DialogTitle>
            <DialogDescription>Add a note to {lead?.customerName}'s lead</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Note</Label>
              <Textarea
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
                rows={4}
                placeholder="Enter your note..."
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>Cancel</Button>
              <Button onClick={handleAddNote} className="bg-gradient-to-r from-orange-500 to-red-500">
                Add Note
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const LeadCard: React.FC<{
  lead: any;
  index: number;
  onStatusChange: (id: string, status: any) => void;
  onCall: () => void;
  onViewDetails: () => void;
  onAddNote: () => void;
}> = ({ lead, index, onStatusChange, onCall, onViewDetails, onAddNote }) => {
  const statusColors = {
    new: 'bg-blue-500',
    contacted: 'bg-purple-500',
    qualified: 'bg-yellow-500',
    proposal: 'bg-orange-500',
    negotiation: 'bg-pink-500',
    won: 'bg-green-500',
    lost: 'bg-red-500',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:shadow-lg transition-shadow">
        <CardContent className="p-4">
          <div className="flex gap-4">
            <div className={`w-12 h-12 rounded-full ${statusColors[lead.status as keyof typeof statusColors]} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
              {lead.customerName.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4 mb-2">
                <div>
                  <h3 className="font-semibold">{lead.customerName}</h3>
                  <p className="text-sm text-slate-600">{lead.id}</p>
                </div>
                <Select value={lead.status} onValueChange={(value) => onStatusChange(lead.id, value)}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="proposal">Proposal</SelectItem>
                    <SelectItem value="negotiation">Negotiation</SelectItem>
                    <SelectItem value="won">Won</SelectItem>
                    <SelectItem value="lost">Lost</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid md:grid-cols-2 gap-2 mb-3 text-sm">
                <div className="flex items-center gap-2">
                  <Phone className="h-3 w-3 text-slate-500" />
                  <span>{lead.customerPhone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="h-3 w-3 text-slate-500" />
                  <span className="font-semibold text-green-600">
                    ₹{lead.estimatedValue.toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" onClick={onCall} className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600">
                  <PhoneCall className="h-3 w-3 mr-1" />
                  Call
                </Button>
                <Button size="sm" variant="outline" onClick={onAddNote}>
                  <FileText className="h-3 w-3 mr-1" />
                  Add Note
                </Button>
                <Button size="sm" variant="outline" onClick={onViewDetails}>
                  View Details
                </Button>
                <Badge variant="secondary" className="ml-auto">
                  {lead.callLogs.length} calls
                </Badge>
                <Badge variant="secondary">
                  {lead.notes.length} notes
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};