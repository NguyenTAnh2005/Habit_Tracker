import { Navigate, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import authApi from '../api/authApi';

const AdminRoute = () => {
  const [isAdmin, setIsAdmin] = useState(null); // null = chưa check, true = admin, false = user
  
  useEffect(() => {
    const checkRole = async () => {
      try {
        const user = await authApi.getMe();
        // Giả sử quy ước: role_id = 1 là Admin
        if (user && user.role_id === 1) {
          setIsAdmin(true);
        } else {
          setIsAdmin(false);
        }
      } catch (error) {
        setIsAdmin(false);
      }
    };
    checkRole();
  }, []);

  if (isAdmin === null) return <div className="p-10 text-center">Đang kiểm tra quyền... 🔐</div>;
  
  // Nếu là Admin -> Cho vào (Outlet là các trang con bên trong)
  // Nếu không -> Đá về trang chủ
  return isAdmin ? <Outlet /> : <Navigate to="/" />;
};

export default AdminRoute;