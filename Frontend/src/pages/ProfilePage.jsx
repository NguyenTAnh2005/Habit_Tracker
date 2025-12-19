import { useState, useEffect } from 'react';
import { User, Mail, Lock, Shield, Save, LogOut, Camera, Eye, EyeOff, X, Edit3, AtSign } from 'lucide-react';
import authApi from '../api/authApi';
import userApi from '../api/userAPI';
import { useNavigate } from 'react-router-dom';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Trạng thái giao diện
  const [isEditing, setIsEditing] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  
  // Dữ liệu Form 
  const [formData, setFormData] = useState({
    username: '', 
    full_name: '',
    email: '',
    password: ''
  });

  const [verifyPass, setVerifyPass] = useState('');
  const [verifying, setVerifying] = useState(false);
  const [showVerifyPass, setShowVerifyPass] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 1. Load thông tin user
  const fetchUser = async () => {
    try {
      const res = await authApi.getMe();
      setUser(res);
      // Reset form (Set cả username)
      setFormData({
        username: res.username,
        full_name: res.full_name,
        email: res.email,
        password: ''
      });
    } catch (error) {
      console.error("Lỗi load profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  // ... (Các hàm handleEditClick, handleVerifySubmit giữ nguyên) ...
  const handleEditClick = () => {
    setVerifyPass('');
    setShowVerifyPass(false);
    setShowVerifyModal(true);
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    setVerifying(true);
    try {
      await userApi.verifyPassword(verifyPass);
      setIsEditing(true);
      setShowVerifyModal(false);
      alert("✅ Xác minh thành công! Bạn có thể sửa thông tin.");
    } catch (error) {
      alert("❌ Mật khẩu không đúng!");
    } finally {
      setVerifying(false);
    }
  };

  // 4. Xử lý Lưu thay đổi
  const handleSave = async (e) => {
    e.preventDefault();
    if (!window.confirm("Lưu các thay đổi này?")) return;

    try {
      const dataToSend = {
        username: formData.username, // 👈 Gửi username lên
        full_name: formData.full_name,
        email: formData.email
      };
      
      if (formData.password) {
        dataToSend.password = formData.password;
      }

      await userApi.updateProfile(dataToSend);
      alert("🎉 Cập nhật hồ sơ thành công!");
      
      setIsEditing(false);
      fetchUser();
    } catch (error) {
      alert("Lỗi cập nhật: " + (error.response?.data?.detail || "Có lỗi xảy ra"));
    }
  };

  // 5. Hủy chỉnh sửa
  const handleCancel = () => {
    setIsEditing(false);
    setFormData({
        username: user.username, // 👈 Reset username về cũ
        full_name: user.full_name,
        email: user.email,
        password: ''
    });
  };

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
        <p className="text-gray-500">Quản lý thông tin và bảo mật</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Card Avatar */}
        <div className="md:col-span-1">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="h-24 w-24 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-3xl font-bold border-4 border-white shadow-md mx-auto">
                {user?.full_name?.charAt(0).toUpperCase() || 'U'}
              </div>
              <button className="absolute bottom-0 right-0 p-1.5 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition">
                <Camera size={14} />
              </button>
            </div>
            <h2 className="text-xl font-bold text-gray-800">{user?.full_name}</h2>
            <p className="text-sm text-gray-500 mb-4">@{user?.username}</p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
              <Shield size={12}/> {user?.role_id === 1 ? 'Admin' : 'Thành viên'}
            </div>
          </div>
        </div>

        {/* Form Thông tin */}
        <div className="md:col-span-2">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-center mb-6 border-b pb-4">
                <h3 className="text-lg font-bold text-gray-800">Thông tin chi tiết</h3>
                
                {!isEditing ? (
                    <button onClick={handleEditClick} className="flex items-center gap-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 px-3 py-2 rounded-lg transition">
                        <Edit3 size={16}/> Chỉnh sửa
                    </button>
                ) : (
                    <button onClick={handleCancel} className="text-sm font-medium text-gray-500 hover:bg-gray-100 px-3 py-2 rounded-lg transition">
                        Hủy bỏ
                    </button>
                )}
            </div>

            <form onSubmit={handleSave} className="space-y-5">
              
              {/* 👇 Ô INPUT USERNAME MỚI */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tên đăng nhập (Username)</label>
                <div className="relative">
                  <AtSign className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    className={`w-full rounded-lg border pl-10 p-2 outline-none transition
                        ${isEditing ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                    value={formData.username}
                    onChange={(e) => setFormData({...formData, username: e.target.value})}
                  />
                </div>
              </div>

              {/* Họ tên */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    disabled={!isEditing}
                    className={`w-full rounded-lg border pl-10 p-2 outline-none transition
                        ${isEditing ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                    value={formData.full_name}
                    onChange={(e) => setFormData({...formData, full_name: e.target.value})}
                  />
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type="email"
                    disabled={!isEditing}
                    className={`w-full rounded-lg border pl-10 p-2 outline-none transition
                        ${isEditing ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </div>
              </div>

              {/* Mật khẩu mới */}
              <div className={`transition-all duration-300 ${isEditing ? 'opacity-100' : 'opacity-50'}`}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    {isEditing ? "Mật khẩu mới (Để trống nếu không đổi)" : "Mật khẩu"}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    disabled={!isEditing}
                    placeholder={isEditing ? "Nhập mật khẩu mới..." : "********"}
                    className={`w-full rounded-lg border pl-10 pr-10 p-2 outline-none transition
                        ${isEditing ? 'border-indigo-300 focus:ring-2 focus:ring-indigo-500 bg-white' : 'border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed'}`}
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
                </div>
              </div>

              {/* Footer Buttons */}
              <div className="pt-4 flex items-center gap-3 border-t mt-4">
                {isEditing && (
                    <button type="submit" className="flex items-center gap-2 px-5 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition shadow-md font-medium">
                        <Save size={18} /> Lưu thay đổi
                    </button>
                )}
                <button type="button" onClick={handleLogout} className="flex items-center gap-2 px-5 py-2 bg-white text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition ml-auto">
                  <LogOut size={18} /> Đăng xuất
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Modal Verify (Giữ nguyên) */}
      {showVerifyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-800">Xác minh bảo mật</h3>
              <button onClick={() => setShowVerifyModal(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
            </div>
            
            <p className="text-sm text-gray-500 mb-4">
                Vui lòng nhập <b>mật khẩu hiện tại</b> của bạn để xác nhận quyền chỉnh sửa thông tin.
            </p>
            
            <form onSubmit={handleVerifySubmit}>
              <div className="mb-4 relative">
                  <input 
                    type={showVerifyPass ? "text" : "password"} 
                    autoFocus required
                    placeholder="Mật khẩu hiện tại..."
                    className="w-full border border-gray-300 rounded-lg p-2.5 pr-10 focus:ring-2 focus:ring-indigo-500 outline-none"
                    value={verifyPass}
                    onChange={e => setVerifyPass(e.target.value)}
                  />
                  <button type="button" onClick={() => setShowVerifyPass(!showVerifyPass)} className="absolute right-3 top-3 text-gray-400 hover:text-gray-600">
                    {showVerifyPass ? <EyeOff size={18}/> : <Eye size={18}/>}
                  </button>
              </div>
              <button type="submit" disabled={verifying} className="w-full bg-indigo-600 text-white py-2.5 rounded-lg font-bold hover:bg-indigo-700 transition flex justify-center">
                {verifying ? "Đang kiểm tra..." : "Xác nhận"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
export default ProfilePage;