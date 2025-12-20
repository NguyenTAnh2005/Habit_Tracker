import { useEffect, useState } from 'react';
import { 
  Home, List, BarChart2, User, LogOut, UserRoundCog, ShieldCheck, X 
} from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';
import authApi from '../api/authAPI';

// 👇 Nhận props từ MainLayout
const Sidebar = ({ isOpen, toggleSidebar }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
        try {
            const userData = await authApi.getMe();
            setUser(userData);
        } catch (e) {
            console.error("Lỗi lấy thông tin user:", e);
        }
    };
    fetchUser();
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

  const getInitials = (name) => name ? name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* 1. OVERLAY (Lớp phủ mờ khi mở menu trên mobile) */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* 2. SIDEBAR CHÍNH */}
      <div className={`fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:inset-auto flex flex-col h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
      `}>
        {/* Header Logo */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200 shrink-0">
          <h1 className="text-2xl font-extrabold text-indigo-600 tracking-tight flex items-center gap-2">
              HabitTracker 🚀
          </h1>
          {/* Nút đóng trên mobile */}
          <button onClick={toggleSidebar} className="md:hidden text-gray-500 hover:text-gray-700">
            <X size={24} />
          </button>
        </div>

        {/* Menu Items (Có scroll nếu dài) */}
        <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => window.innerWidth < 768 && toggleSidebar()} // Tự đóng khi click link trên mobile
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  isActive 
                  ? 'bg-indigo-50 text-indigo-600 shadow-sm' 
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              {item.icon} {item.name}
            </NavLink>
          ))}

          {/* Menu Admin */}
          {user?.role_id === 1 && (
              <>
                  <div className="mt-6 mb-2 px-4">
                      <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Quản trị viên</p>
                  </div>
                  <NavLink
                      to="/admin/manager"
                      onClick={() => window.innerWidth < 768 && toggleSidebar()}
                      className={({ isActive }) =>
                      `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
                          isActive 
                          ? 'bg-purple-50 text-purple-700 shadow-sm' 
                          : 'text-gray-600 hover:bg-gray-50 hover:text-purple-600'
                      }`
                      }
                  >
                      <UserRoundCog size={20} /> Quản trị hệ thống
                  </NavLink>
              </>
          )}
        </nav>

        {/* User Info Footer */}
        <div className="border-t border-gray-200 p-4 bg-gray-50/50 shrink-0">
          {user && (
              <div className="flex items-center gap-3 mb-4 p-2 rounded-xl border border-gray-200 bg-white shadow-sm">
                  <div className="h-10 w-10 shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-lg border border-indigo-200">
                      {getInitials(user.full_name)}
                  </div>
                  <div className="overflow-hidden">
                      <p className="text-sm font-bold text-gray-800 truncate" title={user.full_name}>
                          {user.full_name}
                      </p>
                      <div className="flex items-start">
                          {user.role_id === 1 ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700 border border-purple-200">
                                  <ShieldCheck size={10} /> Admin
                              </span>
                          ) : (
                              <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-600 border border-gray-200">
                                  Member
                              </span>
                          )}
                      </div>
                  </div>
              </div>
          )}

          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 border border-transparent hover:border-red-100"
          >
            <LogOut size={18} />
            Đăng xuất
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
