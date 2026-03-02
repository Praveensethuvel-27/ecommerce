import { Outlet } from 'react-router-dom';
import AdminSidebar from '../../components/admin/AdminSidebar';
import { NotificationProvider } from '../../context/NotificationContext';
import { NotificationToast } from './AdminNotifications';

function AdminLayout() {
  return (
    <NotificationProvider>
      <div className="flex min-h-screen bg-[#F5F0E8]">
        <AdminSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-auto pt-16 md:pt-8">
          <Outlet />
        </main>
        <NotificationToast />
      </div>
    </NotificationProvider>
  );
}

export default AdminLayout;