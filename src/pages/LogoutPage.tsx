import { useEffect } from 'react';
import { authService } from '../services/auth';

const LogoutPage: React.FC = () => {
  useEffect(() => {
    localStorage.removeItem('pending_path');
    authService.logout();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center text-gray-700">Signing out…</div>
    </div>
  );
};

export default LogoutPage;
