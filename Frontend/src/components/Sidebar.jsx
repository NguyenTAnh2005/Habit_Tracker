import { Home, List, BarChart2, Settings, LogOut, User } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Xóa token ở cả 2 nơi
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('access_token');
    navigate('/login');
  };

  // Danh sách menu
  const menuItems = [
    { path: '/', name: 'Tổng quan', icon: <Home size={20} /> },
    { path: '/habits', name: 'Thói quen', icon: <List size={20} /> },
    { path: '/stats', name: 'Thống kê', icon: <BarChart2 size={20} /> },
    { path: '/profile', name: 'Tài khoản', icon: <User size={20} /> },
  ];

  return (
    <div className="flex h-screen w-64 flex-col bg-white border-r border-gray-200">
      {/* Logo Area */}
      <div className="flex h-16 items-center justify-center border-b border-gray-200">
        <h1 className="text-2xl font-bold text-indigo-600">HabitTracker 🚀</h1>
      </div>

      {/* Menu Links */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {menuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-indigo-50 text-indigo-600' // Style khi đang chọn
                  : 'text-gray-700 hover:bg-gray-100' // Style bình thường
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      {/* Footer / Logout */}
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