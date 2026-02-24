import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { getBlockedCustomers, unblockCustomer } from '../../utils/api';
import Button from '../../components/common/Button';

function formatDate(d) {
  if (!d) return '-';
  return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function AdminBlockedUsers() {
  const [blocked, setBlocked] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadBlocked = () => {
    getBlockedCustomers()
      .then((list) => setBlocked(Array.isArray(list) ? list : []))
      .catch((err) => setError(err?.message || 'Failed to load blocked users'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    setLoading(true);
    loadBlocked();
  }, []);

  const handleUnblock = async (customer) => {
    if (!confirm(`Unblock ${customer.email}? They will be able to login again.`)) return;
    try {
      await unblockCustomer(customer.id);
      loadBlocked();
    } catch (err) {
      alert(err?.message || 'Failed to unblock');
    }
  };

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Blocked Users</h1>
        <p className="text-[#8B7355]">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-[#6B4423] mb-8">Blocked Users</h1>
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-[#6B4423]">Blocked Users</h1>
        <Link to="/admin/customers">
          <Button variant="outline" size="sm">Back to Customers</Button>
        </Link>
      </div>
      <p className="text-[#8B7355] mb-4">Users listed here cannot login. Unblock to restore access.</p>
      <div className="bg-[#FAFAF8] rounded-2xl overflow-hidden border border-[#8B7355]/10">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[#E8F0E8]/50 border-b border-[#8B7355]/20">
                <th className="text-left p-4 font-medium text-[#6B4423]">Email</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Block Type</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Reason</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Blocked At</th>
                <th className="text-left p-4 font-medium text-[#6B4423]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {blocked.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-[#8B7355]">
                    No blocked users. <Link to="/admin/customers" className="text-[#2D5A27] underline">Go to Customers</Link>
                  </td>
                </tr>
              ) : (
                blocked.map((customer) => (
                  <tr key={customer.id} className="border-b border-[#8B7355]/10 last:border-b-0">
                    <td className="p-4 font-medium text-[#6B4423]">{customer.email}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        customer.blockType === 'permanent' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {customer.blockType === 'permanent' ? 'Permanent' : 'Temporary'}
                      </span>
                    </td>
                    <td className="p-4 text-[#8B7355] text-sm max-w-xs">{customer.blockReason || '-'}</td>
                    <td className="p-4 text-[#8B7355]">{formatDate(customer.blockedAt)}</td>
                    <td className="p-4">
                      <button
                        onClick={() => handleUnblock(customer)}
                        className="flex items-center gap-1 text-[#2D5A27] hover:underline text-sm font-medium"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        Unblock
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default AdminBlockedUsers;
