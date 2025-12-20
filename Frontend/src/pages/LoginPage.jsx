import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, User, Lock, Eye, EyeOff } from 'lucide-react';
import authApi from '../api/authAPI'; 

const LoginPage = () => {
  const navigate = useNavigate();
  
  // State checkbox
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await authApi.login({ email, password });
      console.log("Login Success:", res);
      
      // === 👇 LOGIC QUAN TRỌNG ĐÃ SỬA 👇 ===
      const token = res.access_token;
      
      if (rememberMe) {
        // Nếu chọn Ghi nhớ: Lưu vào LocalStorage (Bền vững)
        localStorage.setItem('access_token', token);
        // Xóa bên Session cho sạch (đề phòng còn sót)
        sessionStorage.removeItem('access_token');
      } else {
        // Nếu KHÔNG chọn: Lưu vào SessionStorage (Tắt tab là mất)
        sessionStorage.setItem('access_token', token);
        // Xóa bên Local cho sạch
        localStorage.removeItem('access_token');
      }
      
      navigate('/'); 
      
    } catch (err) {
      console.error("Login Failed:", err);
      setError(err.response?.data?.detail || 'Đăng nhập thất bại.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-indigo-600">Chào mừng trở lại! 👋</h1>
          <p className="mt-2 text-gray-500">Đăng nhập để quản lý thói quen</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-200">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Email hoặc Username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-gray-300 pl-10 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                // 👇 Logic đổi type ở đây
                type={showPassword ? "text" : "password"} 
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-gray-300 pl-10 pr-10 p-3 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500" // pr-10 để chữ không đè lên icon mắt
                required
              />
              {/* 👇 Nút Toggle Mắt (Mới) */}
              <button
                type="button" // Quan trọng: type="button" để không bị submit form
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
              >
                {showPassword ? (
                  <EyeOff size={20} /> // Đang hiện thì hiện icon "Mắt gạch chéo"
                ) : (
                  <Eye size={20} />    // Đang ẩn thì hiện icon "Mắt mở"
                )}
              </button>
          </div>

          {/* 👇 UI Checkbox Ghi nhớ đăng nhập 👇 */}
          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer select-none">
              <input 
                type="checkbox" 
                className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-600">Ghi nhớ đăng nhập</span>
            </label>
            
            <Link to="/forgot-password" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
              Quên mật khẩu?
            </Link>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 p-3 font-semibold text-white transition hover:bg-indigo-700 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Đang xử lý...' : <><LogIn size={20} /> Đăng nhập</>}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-500">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="font-medium text-indigo-600 hover:underline">
            Đăng ký ngay
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;