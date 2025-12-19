import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Save, LogOut, Camera } from 'lucide-react';
import authApi from '../api/authApi';
import userApi from '../api/userAPI';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // State cho form chỉnh sửa
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });

  // 1. Load thông tin user khi vào trang
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await authApi.getMe();
        setUser(res);
        setFullName(res.full_name);
        setEmail(res.email);
      } catch (error) {
        console.error("Lỗi load profile:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, []);

  // 2. Xử lý cập nhật
  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMessage({ type: '', content: '' });

    try {
      await userApi.updateProfile({
        full_name: fullName,
        email: email
      });
      setMessage({ type: 'success', content: 'Cập nhật thông tin thành công!' });
      
      // Update lại state user hiển thị
      setUser(prev => ({ ...prev, full_name: fullName, email: email }));

    } catch (error) {
      const msg = error.response?.data?.detail || 'Cập nhật thất bại.';
      setMessage({ type: 'error', content: msg });
    } finally {
      setUpdating(false);
    }
  };

  // 3. Xử lý đăng xuất
  const handleLogout = () => {
    if (window.confirm('Bạn có chắc muốn đăng xuất?')) {
      localStorage.removeItem('access_token');
      sessionStorage.removeItem('access_token');
      navigate('/login');
    }
  };

  if (loading) return <div className="p-10 text-center">Đang tải thông tin... ⏳</div>;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Hồ sơ cá nhân</h1>
        <p className="text-gray-500">Quản lý thông tin và cài đặt tài khoản của bạn</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CỘT TRÁI: Card thông tin tóm tắt */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-md mx-auto">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition" title="Đổi Avatar (Coming soon)">
                <Camera size={14} />
              </button>
            </div>
            
            <h2 className="text-xl font-bold text-gray-800">{user?.full_name}</h2>
            <p className="text-sm text-gray-500 mb-4">@{user?.username}</p>
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              {user?.role_id === 1 ? 'Admin' : 'Thành viên'}
            </div>

            <div className="mt-6 border-t pt-4 text-left space-y-3">
              <div className="flex items-center gap-3 text-sm text-gray-600">
                <Calendar size={16} className="text-indigo-500" />
                <span>Tham gia: {new Date(user?.created_at).toLocaleDateString('vi-VN')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* CỘT PHẢI: Form chỉnh sửa */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">Chỉnh sửa thông tin</h3>

            {message.content && (
              <div className={`mb-4 p-3 rounded-lg text-sm flex items-center gap-2 ${
                message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
              }`}>
                {message.content}
              </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    required
                    className="w-full rounded-lg border border-gray-300 pl-10 p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    required
                    className="w-full rounded-lg border border-gray-300 pl-10 p-2 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="submit"
                  disabled={updating}
                  className="flex items-center gap-2 px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition shadow-md disabled:opacity-70"
                >
                  {updating ? 'Đang lưu...' : <><Save size={18} /> Lưu thay đổi</>}
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-5 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition ml-auto"
                >
                  <LogOut size={18} /> Đăng xuất
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfilePage;