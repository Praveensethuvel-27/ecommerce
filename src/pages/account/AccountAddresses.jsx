import { useState } from 'react';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Input from '../../components/common/Input';
import Modal from '../../components/common/Modal';

const mockAddresses = [
  { id: '1', name: 'Home', address: '123 Main St, Chennai, Tamil Nadu 600001', phone: '9876543210' },
  { id: '2', name: 'Office', address: '456 Office Rd, Coimbatore, Tamil Nadu 641001', phone: '9876543211' },
];

function AccountAddresses() {
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', address: '', phone: '' });
  const [addresses, setAddresses] = useState(mockAddresses);

  const handleAdd = (e) => {
    e.preventDefault();
    setAddresses([...addresses, { id: Date.now().toString(), ...form }]);
    setForm({ name: '', address: '', phone: '' });
    setModalOpen(false);
  };

  const handleDelete = (id) => {
    setAddresses(addresses.filter((a) => a.id !== id));
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#6B4423]">Addresses</h1>
        <Button variant="primary" size="sm" onClick={() => setModalOpen(true)}>Add Address</Button>
      </div>
      <div className="space-y-4">
        {addresses.map((addr) => (
          <Card key={addr.id} className="flex justify-between items-start">
            <div>
              <p className="font-medium text-[#6B4423]">{addr.name}</p>
              <p className="text-[#8B7355] text-sm mt-1">{addr.address}</p>
              <p className="text-[#8B7355] text-sm">{addr.phone}</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => handleDelete(addr.id)} className="text-red-500">
              Delete
            </Button>
          </Card>
        ))}
      </div>

      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Add Address">
        <form onSubmit={handleAdd} className="space-y-4">
          <Input label="Address Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Full Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} required />
          <Input label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" variant="primary">Add</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

export default AccountAddresses;
