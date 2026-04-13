import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

// This page now redirects to the main order tracking page
function AccountTracking() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate('/track-order', { replace: true });
  }, []);

  return null;
}

export default AccountTracking;