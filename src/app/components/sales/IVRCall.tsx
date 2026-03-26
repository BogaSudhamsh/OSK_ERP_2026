import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { Textarea } from '@/app/components/ui/textarea';
import { useApp } from '@/app/context/AppContext';
import { ArrowLeft, Phone, PhoneCall, PhoneOff, Clock, User, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';

interface IVRCallProps {
  leadId: string;
  onBack: () => void;
}

export const IVRCall: React.FC<IVRCallProps> = ({ leadId, onBack }) => {
  const { customers, leads, updateLead, addCallLogToLead } = useApp();
  const [callState, setCallState] = useState<'idle' | 'calling' | 'connected' | 'ended'>('idle');
  const [callDuration, setCallDuration] = useState(0);
  const [callNotes, setCallNotes] = useState('');
  const [callStatus, setCallStatus] = useState<'answered' | 'missed'>('answered');

  const customer = customers.find(c => c.id === leadId);
  const leadInfo = leads.find(l => l.customerId === leadId);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  if (!customer) {
    return (
      <div className="text-center py-16">
        <p className="text-[#6B6B6B]">Customer not found</p>
        <Button onClick={onBack} className="mt-4">Go Back</Button>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartCall = () => {
    setCallState('calling');
    toast.info('Connecting to IVR system...');
    
    // Simulate call connection
    setTimeout(() => {
      setCallState('connected');
      toast.success('Call connected!');
    }, 2000);
  };

  const handleEndCall = () => {
    setCallState('ended');
    toast.success('Call ended');
  };

  const handleSaveCall = () => {
    if (leadInfo) {
      addCallLogToLead(leadInfo.id, {
        type: 'outgoing',
        duration: callDuration,
        status: callStatus === 'answered' ? 'completed' : 'missed',
        notes: callNotes,
        createdBy: 'ivr-system',
      });

      updateLead(leadInfo.id, {
        lastContact: new Date().toISOString(),
      });
    }

    toast.success('Call logged successfully');
    onBack();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={onBack}
          className="text-[#B8860B] hover:bg-[#FFF8F0]"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <div className="text-center">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-[#B8860B] to-[#DAA520] bg-clip-text text-transparent mb-2">
          IVR Call System
        </h1>
        <p className="text-[#6B6B6B]">Integrated voice response calling</p>
      </div>

      {/* Customer Card */}
      <Card className="border-[#B8860B]/20 bg-gradient-to-br from-[#FFF8F0] to-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-[#1A1A1A]">{customer.name}</h3>
              <div className="flex items-center gap-2 text-[#6B6B6B] mt-1">
                <Phone className="w-4 h-4" />
                <span className="font-mono">{customer.phone}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Call Interface */}
      <AnimatePresence mode="wait">
        {callState === 'idle' && (
          <motion.div
            key="idle"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-[#B8860B]/20">
              <CardContent className="py-16 text-center">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-[#B8860B] to-[#DAA520] flex items-center justify-center shadow-2xl">
                  <Phone className="w-12 h-12 text-white" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">Ready to Call</h3>
                <p className="text-[#6B6B6B] mb-6">Click the button below to start IVR call</p>
                <Button
                  onClick={handleStartCall}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-8 py-6 text-lg"
                  size="lg"
                >
                  <PhoneCall className="w-5 h-5 mr-2" />
                  Start Call
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {callState === 'calling' && (
          <motion.div
            key="calling"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-[#B8860B]/20">
              <CardContent className="py-16 text-center">
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl"
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                >
                  <Phone className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">Calling...</h3>
                <p className="text-[#6B6B6B]">Connecting to {customer.phone}</p>
                <div className="flex gap-2 justify-center mt-6">
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {callState === 'connected' && (
          <motion.div
            key="connected"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <Card className="border-green-500/30 bg-gradient-to-br from-green-50 to-white">
              <CardContent className="py-16 text-center">
                <motion.div
                  className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center shadow-2xl"
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <PhoneCall className="w-12 h-12 text-white" />
                </motion.div>
                <h3 className="text-xl font-semibold text-green-700 mb-2">Call Connected</h3>
                <div className="flex items-center justify-center gap-2 text-2xl font-mono font-bold text-green-600 mb-6">
                  <Clock className="w-6 h-6" />
                  {formatDuration(callDuration)}
                </div>
                <Button
                  onClick={handleEndCall}
                  className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white px-8 py-6 text-lg"
                  size="lg"
                >
                  <PhoneOff className="w-5 h-5 mr-2" />
                  End Call
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {callState === 'ended' && (
          <motion.div
            key="ended"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <Card className="border-[#B8860B]/20">
              <CardHeader>
                <CardTitle className="text-[#B8860B] flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" />
                  Call Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-[#FFF8F0] border border-[#B8860B]/20">
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div>
                      <p className="text-sm text-[#6B6B6B] mb-1">Duration</p>
                      <p className="text-2xl font-bold text-[#B8860B]">{formatDuration(callDuration)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#6B6B6B] mb-1">Time</p>
                      <p className="text-lg font-semibold text-[#1A1A1A]">
                        {new Date().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Call Status</label>
                  <div className="flex gap-3">
                    <Button
                      variant={callStatus === 'answered' ? 'default' : 'outline'}
                      onClick={() => setCallStatus('answered')}
                      className={
                        callStatus === 'answered'
                          ? 'bg-green-500 hover:bg-green-600 text-white flex-1'
                          : 'flex-1 border-[#B8860B]/30'
                      }
                    >
                      Answered
                    </Button>
                    <Button
                      variant={callStatus === 'missed' ? 'default' : 'outline'}
                      onClick={() => setCallStatus('missed')}
                      className={
                        callStatus === 'missed'
                          ? 'bg-red-500 hover:bg-red-600 text-white flex-1'
                          : 'flex-1 border-[#B8860B]/30'
                      }
                    >
                      Missed
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-[#1A1A1A]">Call Notes</label>
                  <Textarea
                    placeholder="Add notes about the call..."
                    value={callNotes}
                    onChange={(e) => setCallNotes(e.target.value)}
                    className="border-[#B8860B]/30 focus:border-[#B8860B] min-h-[120px]"
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button
                    variant="outline"
                    onClick={onBack}
                    className="flex-1 border-[#B8860B]/30 text-[#B8860B]"
                  >
                    Discard
                  </Button>
                  <Button
                    onClick={handleSaveCall}
                    className="flex-1 bg-gradient-to-r from-[#B8860B] to-[#DAA520] hover:from-[#8B6914] hover:to-[#B8860B] text-white"
                  >
                    Save Call Log
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
