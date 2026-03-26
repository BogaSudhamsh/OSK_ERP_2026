import React from 'react';
import { Card, CardContent } from '@/app/components/ui/card';
import { Button } from '@/app/components/ui/button';
import { FileText, Users, Zap } from 'lucide-react';

interface NewOrderProps {
  onNavigate: (page: string) => void;
}

export const NewOrder: React.FC<NewOrderProps> = ({ onNavigate }) => {
  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-[#C9A961] mb-2">Create New Order</h1>
        <p className="text-[#C9A961]/70">
          Choose how you want to create the order
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {/* Quick Order */}
        <div>
          <Card className="border-[#C9A961]/30 bg-[#1F1F1F] hover:border-[#C9A961] hover:shadow-xl hover:shadow-[#C9A961]/20 transition-all h-full">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#C9A961] to-[#D4AF37] rounded-full flex items-center justify-center mx-auto mb-6">
                <Zap className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#C9A961] mb-3">Quick Order</h3>
              <p className="text-[#C9A961]/70 mb-6">
                Select existing customer, browse products, add to cart, and checkout
              </p>
              <ul className="text-left space-y-2 text-sm text-[#C9A961]/80 mb-8">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                  <span>Use existing customers</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                  <span>Quick product selection</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#C9A961]" />
                  <span>Fast checkout process</span>
                </li>
              </ul>
              <Button
                onClick={() => onNavigate('Products')}
                className="w-full bg-gradient-to-r from-[#C9A961] to-[#D4AF37] hover:opacity-90 text-white py-6 text-lg"
              >
                Start Quick Order
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Complete Workflow */}
        <div>
          <Card className="border-[#C9A961]/30 bg-[#1F1F1F] hover:border-[#7C1D1D] hover:shadow-xl hover:shadow-[#7C1D1D]/20 transition-all h-full">
            <CardContent className="p-8 text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-[#7C1D1D] to-[#9B2C2C] rounded-full flex items-center justify-center mx-auto mb-6">
                <FileText className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-[#C9A961] mb-3">Complete Workflow</h3>
              <p className="text-[#C9A961]/70 mb-6">
                Full process with customer registration, AI visualization, and PO generation
              </p>
              <ul className="text-left space-y-2 text-sm text-[#C9A961]/80 mb-8">
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C1D1D]" />
                  <span>Register new customer</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C1D1D]" />
                  <span>AI room visualization</span>
                </li>
                <li className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#7C1D1D]" />
                  <span>Professional PO generation</span>
                </li>
              </ul>
              <Button
                className="w-full bg-gradient-to-r from-[#7C1D1D] to-[#9B2C2C] hover:opacity-90 text-white py-6 text-lg"
              >
                Start Complete Workflow
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};