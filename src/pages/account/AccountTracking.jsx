import { useState } from 'react';
import { Check } from 'lucide-react';
import Card from '../../components/common/Card';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';

const steps = ['Order Placed', 'Confirmed', 'Shipped', 'Out for Delivery', 'Delivered'];

function AccountTracking() {
  const [orderId, setOrderId] = useState('');
  const [currentStep, setCurrentStep] = useState(3);

  const handleTrack = (e) => {
    e.preventDefault();
    setCurrentStep(3);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Delivery Tracking</h1>
      <Card className="mb-8">
        <form onSubmit={handleTrack} className="flex gap-4 max-w-md">
          <Input
            placeholder="Enter Order ID"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
          <Button type="submit" variant="primary">Track</Button>
        </form>
      </Card>
      <Card>
        <h2 className="font-semibold text-[#6B4423] mb-6">Order Status</h2>
        <div className="flex flex-col sm:flex-row justify-between relative">
          {steps.map((step, i) => (
            <div key={step} className="flex flex-col items-center flex-1 relative">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-medium ${
                  i <= currentStep ? 'bg-[#2D5A27] text-white' : 'bg-[#E8F0E8] text-[#8B7355]'
                }`}
              >
                {i < currentStep ? <Check className="w-5 h-5" /> : i + 1}
              </div>
              <p className={`mt-2 text-sm font-medium ${i <= currentStep ? 'text-[#2D5A27]' : 'text-[#8B7355]'}`}>
                {step}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}

export default AccountTracking;
