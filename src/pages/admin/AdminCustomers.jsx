import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Ban, ShieldOff } from 'lucide-react';
import { getCustomers } from '../../utils/api';
import { blockCustomer } from '../../utils/api';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [blockModalOpen, setBlockModalOpen] = useState(false);
  const [blockingCustomer, setBlockingCustomer] = useState(null);
  const [blockType, setBlockType] = useState('temporary');
  const [blockReason, setBlockReason] = useState('');

  const loadCustomers = () => {
    getCustomers()
      .then((list) => setCustomers(Array.isArray(list) ? list : []))
      .catch((err) => setError(err?.message || 'Failed to load customers'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    loadCustomers();
  }, []);

  const handleBlockClick = (customer) => {
    setBlockingCustomer(customer);
    setBlockType('temporary');
    setBlockReason('');
    setBlockModalOpen(true);
  };

  const handleBlockSubmit = async (e) => {
    e.preventDefault();
    if (!blockingCustomer) return;
    try {
      await blockCustomer(blockingCustomer.id, blockType, blockReason);
      setBlockModalOpen(false);
      setBlockingCustomer(null);
      loadCustomers();
    } catch (err) {
      alert(err?.message || 'Failed to block customer');
    }
  };

  const handleBlockCancel = () => {
    setBlockModalOpen(false);
    setBlockingCustomer(null);
    setBlockType('temporary');
    setBlockReason('');
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Customers</h1>
        <p className="text-[#8B7355]">Loading customers…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Customers</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#6B4423]">Customers</h1>
        <Link to="/admin/customers/blocked">
          <Button variant="outline" size="sm">
            <ShieldOff className="w-4 h-4 mr-1 inline" />
            Blocked Users
          </Button>
        </Link>
      </div>
      <p className="text-[#8B7355] mb-4">Only registered customers are shown below. Block a customer to restrict their access.</p>
      <div className="bg-[#FAFAF8] rounded-2xl overflow-hidden border border-[#8B7355]/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#E8F0E8]/50 border-b border-[#8B7355]/20">
                <th className="text-left p-4 font-medium text-[#6B4423]">Email</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Registered</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Total Orders</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Last Order</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#8B7355]">
                    No customers have registered yet.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-[#8B7355]/10 last:border-b-0">
                    <td className="p-4 font-medium text-[#6B4423]">{customer.email}</td>
                    <td className="p-4 text-[#8B7355]">{formatDate(customer.registeredAt)}</td>
                    <td className="p-4 text-[#6B4423]">{customer.orderCount}</td>
                    <td className="p-4 text-[#8B7355]">{formatDate(customer.lastOrder)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleBlockClick(customer)}
                        className="flex items-center gap-1 text-red-600 hover:text-red-700 hover:underline text-sm"
                      >
                        <Ban className="w-4 h-4" />
                        Block
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={blockModalOpen} onClose={handleBlockCancel} title="Block Customer">
        {blockingCustomer && (
          <form onSubmit={handleBlockSubmit} className="space-y-4">
            <p className="text-[#6B4423]">
              Block <strong>{blockingCustomer.email}</strong>?
            </p>
            <div>
              <label className="block text-sm font-medium text-[#6B4423] mb-2">Block Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="blockType"
                    value="temporary"
                    checked={blockType === 'temporary'}
                    onChange={() => setBlockType('temporary')}
                  />
                  <span className="text-[#6B4423]">Temporary</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="blockType"
                    value="permanent"
                    checked={blockType === 'permanent'}
                    onChange={() => setBlockType('permanent')}
                  />
                  <span className="text-[#6B4423]">Permanent</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#6B4423] mb-1">Reason (optional)</label>
              <textarea
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                placeholder="Enter reason for blocking..."
                className="w-full px-4 py-2.5 rounded-xl border border-[#8B7355]/30 bg-white text-[#6B4423]"
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={handleBlockCancel}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" className="bg-red-600 hover:bg-red-700">
                Block
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}

export default AdminCustomers;
