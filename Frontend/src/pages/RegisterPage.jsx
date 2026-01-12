import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
// 👇 1. Thêm Eye và EyeOff vào import
import { User, Mail, Lock, UserPlus, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react';
import authApi from '../api/authAPI';

const RegisterPage = () => {
  const navigate = useNavigate();
  
  // State form
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    full_name: '',
    password: '',
    confirmPassword: ''
  });

  // 👇 2. Thêm state để quản lý việc hiển thị cho 2 ô mật khẩu
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [loading, setLoading] = useState(false);

  // Xử lý khi nhập liệu
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // 1. Validate cơ bản ở Client
    if (formData.password !== formData.confirmPassword) {
      setError('Mật khẩu nhập lại không khớp!');
      return;
    }
    if (formData.password.length < 6) {
      setError('Mật khẩu phải có ít nhất 6 ký tự.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        username: formData.username,
        email: formData.email,
        full_name: formData.full_name,
        password: formData.password
      };

      await authApi.register(payload);
      
      setSuccessMsg('Đăng ký thành công! Đang chuyển hướng đăng nhập...');
      
      setTimeout(() => {
        navigate('/login');
      }, 1500);

    } catch (err) {
      console.error("Register Error:", err);
      const msg = err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng thử lại.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl border border-gray-100">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
            <UserPlus size={24} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Tạo tài khoản mới</h1>
          <p className="mt-1 text-sm text-gray-500">Bắt đầu hành trình xây dựng thói quen tốt!</p>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-600 border border-red-100 animate-pulse">
            <AlertCircle size={16} /> {error}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-600 border border-green-100">
            <CheckCircle size={16} /> {successMsg}
          </div>
        )}

        <form onSubmit={handleRegister} className="space-y-4">
          {/* Full Name */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Họ và tên</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="full_name"
                type="text"
                placeholder="Nguyễn Văn A"
                required
                className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.full_name}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Username */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Tên đăng nhập</label>
            <div className="relative">
              <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="username"
                type="text"
                placeholder="user123"
                required
                className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.username}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="email"
                type="email"
                placeholder="email@example.com"
                required
                className="w-full rounded-lg border border-gray-300 pl-10 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* 👇 3. Sửa ô Mật khẩu */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="password"
                // Đổi type động
                type={showPassword ? "text" : "password"}
                placeholder="••••••"
                required
                minLength={6}
                // Thêm pr-10 để chữ không đè lên icon mắt
                className="w-full rounded-lg border border-gray-300 pl-10 pr-10 p-2.5 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                value={formData.password}
                onChange={handleChange}
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {/* 👇 4. Sửa ô Nhập lại mật khẩu */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Nhập lại mật khẩu</label>
            <div className="relative">
              <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <input
                name="confirmPassword"
                // Đổi type động
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••"
                required
                className={`w-full rounded-lg border pl-10 pr-10 p-2.5 focus:outline-none focus:ring-1 ${
                    formData.confirmPassword && formData.password !== formData.confirmPassword 
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500 bg-red-50' 
                    : 'border-gray-300 focus:border-indigo-500 focus:ring-indigo-500'
                }`}
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              <button 
                type="button" 
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 transition"
              >
                {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`mt-6 w-full rounded-lg bg-indigo-600 p-3 font-semibold text-white shadow-md transition hover:bg-indigo-700 ${
              loading ? 'opacity-70 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Đang xử lý...' : 'Đăng ký ngay'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-600">
          Đã có tài khoản?{' '}
          <Link to="/login" className="font-semibold text-indigo-600 hover:text-indigo-500 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;