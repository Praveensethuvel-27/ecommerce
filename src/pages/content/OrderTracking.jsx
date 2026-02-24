import { useState } from 'react';
import { Check } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const steps = ['Order Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

function OrderTracking() {
  const [orderId, setOrderId] = useState('');
  const [currentStep, setCurrentStep] = useState(-1);
  const [searched, setSearched] = useState(false);

  const handleTrack = (e) => {
    e.preventDefault();
    setSearched(true);
    setCurrentStep(3);
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-3xl font-bold text-[#6B4423] mb-8 text-center">Track Your Order</h1>
      <Card className="mb-8">
        <form onSubmit={handleTrack} className="flex flex-col sm:flex-row gap-4">
          <Input
            placeholder="Enter Order ID (e.g. ORD-001)"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <Button type="submit" variant="primary" className="sm:self-end">Track</Button>
        </form>
      </Card>

      {searched && (
        <Card>
          <h2 className="font-semibold text-[#6B4423] mb-6">Order Status</h2>
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            {steps.map((step, i) => (
              <div key={step} className="flex flex-col items-center flex-1">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                    i <= currentStep ? 'bg-[#2D5A27] text-white' : 'bg-[#E8F0E8] text-[#8B7355]'
                  }`}
                >
                  {i < currentStep ? <Check className="w-5 h-5" /> : i + 1}
                </div>
                <p className={`mt-2 text-sm font-medium text-center ${i <= currentStep ? 'text-[#2D5A27]' : 'text-[#8B7355]'}`}>
                  {step}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

export default OrderTracking;
