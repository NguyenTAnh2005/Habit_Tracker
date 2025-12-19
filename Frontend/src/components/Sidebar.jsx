import { LogOut } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Home, List, BarChart2, User, Users, Shield } from 'lucide-react'; // Thêm icon Users, Shield
import { NavLink, useNavigate } from 'react-router-dom';
import authApi from '../api/authApi';

const Sidebar = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  // Check quyền lúc mount sidebar
  useEffect(() => {
    const checkUser = async () => {
        try {
            const user = await authApi.getMe();
            if (user.role_id === 1) setIsAdmin(true);
        } catch (e) {
            // Lỗi thì thôi coi như user thường
        }
    };
    checkUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    navigate('/login');
  };

  const menuItems = [
    { path: '/', name: 'Tổng quan', icon: <Home size={20} /> },
    { path: '/habits', name: 'Thói quen', icon: <List size={20} /> },
    { path: '/stats', name: 'Thống kê', icon: <BarChart2 size={20} /> },
    { path: '/profile', name: 'Tài khoản', icon: <User size={20} /> },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-2xl font-bold text-indigo-600">HabitTracker 🚀</h1>
      </div>

      <nav className="flex-1 space-y-1 px-2 py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'
              }`
            }
          >
            {item.icon} {item.name}
          </NavLink>
        ))}

        {/* 👇 MENU RIÊNG CHO ADMIN */}
        {isAdmin && (
            <>
                <div className="pt-4 pb-2">
                    <p className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Quản trị viên</p>
                </div>
                <NavLink
                    to="/admin/users"
                    className={({ isActive }) =>
                    `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                        isActive ? 'bg-purple-50 text-purple-600' : 'text-gray-700 hover:bg-gray-100'
                    }`
                    }
                >
                    <Users size={20} /> Quản lý User
                </NavLink>
            </>
        )}
      </nav>

     <div className="border-t border-gray-200 p-4">
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded-lg px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          <LogOut size={20} />
          Đăng xuất
        </button>
      </div>
    </div>
  );
};

export default Sidebar;