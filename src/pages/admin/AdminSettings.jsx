import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/common/Input';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';

function AdminSettings() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
  });
  const [config, setConfig] = useState({
    siteName: "Grand Ma's Care",
    contactEmail: 'hello@grandmascare.com',
    shippingThreshold: 999,
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    alert('Profile updated!');
  };

  const handleConfigSubmit = (e) => {
    e.preventDefault();
    alert('Settings saved!');
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Settings</h1>

      <Card className="mb-8">
        <h2 className="font-semibold text-[#6B4423] mb-4">Admin Profile</h2>
        <form onSubmit={handleProfileSubmit} className="space-y-4 max-w-md">
          <Input label="Name" value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
          <Input label="Email" type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
          <Input label="New Password" type="password" value={profile.password} onChange={(e) => setProfile({ ...profile, password: e.target.value })} placeholder="Leave blank to keep current" />
          <Button type="submit" variant="primary">Update Profile</Button>
        </form>
      </Card>

      <Card>
        <h2 className="font-semibold text-[#6B4423] mb-4">System Configuration</h2>
        <form onSubmit={handleConfigSubmit} className="space-y-4 max-w-md">
          <Input label="Site Name" value={config.siteName} onChange={(e) => setConfig({ ...config, siteName: e.target.value })} />
          <Input label="Contact Email" type="email" value={config.contactEmail} onChange={(e) => setConfig({ ...config, contactEmail: e.target.value })} />
          <Input label="Free Shipping Threshold (Rs.)" type="number" value={config.shippingThreshold} onChange={(e) => setConfig({ ...config, shippingThreshold: Number(e.target.value) })} />
          <Button type="submit" variant="primary">Save Settings</Button>
        </form>
      </Card>
    </div>
  );
}

export default AdminSettings;
