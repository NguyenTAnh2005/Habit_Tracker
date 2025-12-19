import { useState, useEffect } from 'react';
import { Search, Shield, Trash2, Edit, User, UserCheck, UserX } from 'lucide-react';
import userApi from '../api/userAPI';

const AdminUserPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async (search = '') => {
    setLoading(true);
    try {
      // Gọi API lấy list user (có params search)
      const res = await userApi.getAllUsers({ search: search });
      setUsers(res);
    } catch (error) {
      console.error("Lỗi load users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Xử lý tìm kiếm (Debounce)
  let timeoutId = null;
  const handleSearch = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fetchUsers(value), 500);
  };

  // Xử lý đổi quyền (Thăng chức / Giáng chức)
  const handleChangeRole = async (user) => {
    const newRoleId = user.role_id === 1 ? 2 : 1; // Đảo ngược 1 <-> 2
    const actionName = newRoleId === 1 ? "Thăng chức lên ADMIN" : "Giáng chức xuống USER";
    
    if (window.confirm(`Bạn có chắc muốn ${actionName} cho tài khoản "${user.username}"?`)) {
      try {
        await userApi.updateUserByAdmin(user.id, { role_id: newRoleId });
        alert("Thành công!");
        fetchUsers(searchTerm); // Load lại bảng
      } catch (error) {
        alert("Lỗi: " + error.response?.data?.detail);
      }
    }
  };

  // Xử lý Xóa user
  const handleDelete = async (userId) => {
    if (window.confirm("CẢNH BÁO: Hành động này sẽ xóa User và toàn bộ dữ liệu của họ. Không thể hoàn tác!")) {
      try {
        await userApi.deleteUser(userId);
        fetchUsers(searchTerm);
      } catch (error) {
        alert("Xóa thất bại: " + error.response?.data?.detail);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-gray-500">Danh sách thành viên trong hệ thống</p>
        </div>
        
        {/* Ô Tìm kiếm */}
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={handleSearch}
          />
        </div>
      </div>

      {/* Bảng User */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-500 border-b">
              <tr>
                <th className="px-6 py-3 font-medium">ID</th>
                <th className="px-6 py-3 font-medium">Thông tin</th>
                <th className="px-6 py-3 font-medium">Email</th>
                <th className="px-6 py-3 font-medium">Vai trò</th>
                <th className="px-6 py-3 font-medium text-right">Hành động</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan="5" className="p-6 text-center">Đang tải...</td></tr>
              ) : users.length === 0 ? (
                <tr><td colSpan="5" className="p-6 text-center text-gray-400">Không tìm thấy user nào.</td></tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 text-gray-500">#{u.id}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                          {u.full_name?.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{u.full_name}</p>
                          <p className="text-xs text-gray-500">@{u.username}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-gray-600">{u.email}</td>
                    <td className="px-6 py-4">
                      {u.role_id === 1 ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <Shield size={12} /> Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <User size={12} /> Member
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                        {/* Nút Đổi Role */}
                        <button 
                            onClick={() => handleChangeRole(u)}
                            className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                            title={u.role_id === 1 ? "Hạ xuống Member" : "Thăng lên Admin"}
                        >
                            {u.role_id === 1 ? <UserX size={18}/> : <UserCheck size={18}/>}
                        </button>
                        
                        {/* Nút Xóa */}
                        <button 
                            onClick={() => handleDelete(u.id)}
                            className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Xóa tài khoản"
                        >
                            <Trash2 size={18} />
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserPage;