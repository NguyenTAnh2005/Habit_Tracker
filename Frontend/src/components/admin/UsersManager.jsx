import { useState, useEffect } from 'react';
import { Search, Trash2, Pencil, Plus, Shield, X } from 'lucide-react';
import userApi from '../../api/userAPI'; 

const UsersManager = () => {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  
  const [formData, setFormData] = useState({
    username: '', email: '', full_name: '', password: '', role_id: 2
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const [usersRes, rolesRes] = await Promise.all([
        userApi.getAllUsers({ search: search, role_id: roleFilter || null }),
        userApi.getAllRoles()
      ]);
      setUsers(usersRes);
      setRoles(rolesRes);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchData(), 500);
    return () => clearTimeout(timer);
  }, [search, roleFilter]);

  const openCreate = () => {
    setEditingUser(null);
    setFormData({ username: '', email: '', full_name: '', password: '', role_id: 2 });
    setIsModalOpen(true);
  };

  const openEdit = (user) => {
    setEditingUser(user);
    setFormData({ 
        username: user.username, 
        email: user.email, 
        full_name: user.full_name, 
        password: '', 
        role_id: user.role_id 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
        if (editingUser) {
            await userApi.updateUserByAdmin(editingUser.id, {
                username: formData.username,
                email: formData.email,
                full_name: formData.full_name,
                role_id: parseInt(formData.role_id)
            });
            alert("✅ Cập nhật thành công!");
        } else {
            await userApi.createUserByAdmin({
                ...formData,
                role_id: parseInt(formData.role_id)
            });
            alert("✅ Tạo tài khoản thành công!");
        }
        setIsModalOpen(false);
        fetchData();
    } catch (error) {
        alert("❌ Lỗi: " + (error.response?.data?.detail || "Thất bại"));
    }
  };

  const handleDelete = async (id) => {
    if(!window.confirm("CẢNH BÁO: Xóa user sẽ xóa TOÀN BỘ dữ liệu (Habit, Log) của họ. Tiếp tục?")) return;
    try {
      await userApi.deleteUser(id);
      alert("✅ Xóa thành công!");
      fetchData();
    } catch (error) {
      alert("Lỗi: " + (error.response?.data?.detail || "Không thể xóa"));
    }
  };

  return (
    <div>
      {/* Search Bar Responsive: flex-col trên mobile, flex-row trên PC */}
      <div className="flex flex-col md:flex-row gap-4 mb-6 justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5"/>
                <input type="text" placeholder="Tìm tên, email, username..." className="w-full pl-10 pr-4 py-2 border rounded-lg outline-none focus:ring-2 focus:ring-indigo-500"
                    value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="border rounded-lg px-4 py-2 outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                <option value="">Tất cả quyền</option>
                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
        </div>
        <button onClick={openCreate} className="bg-indigo-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-indigo-700 shadow font-medium">
            <Plus size={18}/> <span className="md:hidden lg:inline">Thêm User</span>
        </button>
      </div>

      {/* Table Responsive: overflow-x-auto để vuốt ngang */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-gray-50 text-gray-700 font-semibold uppercase tracking-wider">
                <tr>
                    <th className="px-4 py-3">ID</th>
                    <th className="px-4 py-3">Username</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Tên hiển thị</th>
                    <th className="px-4 py-3">Vai trò</th>
                    <th className="px-4 py-3">Ngày tạo</th>
                    <th className="px-4 py-3 text-right">Hành động</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 bg-white">
                {users.map(u => (
                    <tr key={u.id} className="hover:bg-gray-50 transition">
                        <td className="px-4 py-3 text-gray-500">#{u.id}</td>
                        <td className="px-4 py-3 font-medium text-gray-900">{u.username}</td>
                        <td className="px-4 py-3 text-gray-600">{u.email}</td>
                        <td className="px-4 py-3">{u.full_name}</td>
                        <td className="px-4 py-3">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold 
                                ${u.role_id === 1 ? 'bg-purple-100 text-purple-700 border border-purple-200' : 'bg-green-100 text-green-700 border border-green-200'}`}>
                                {u.role_id === 1 && <Shield size={10}/>}
                                {roles.find(r => r.id === u.role_id)?.name || `ID: ${u.role_id}`}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-gray-500">
                            {new Date(u.created_at).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-2">
                                <button onClick={() => openEdit(u)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition" title="Sửa"><Pencil size={16}/></button>
                                <button onClick={() => handleDelete(u.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded transition" title="Xóa"><Trash2 size={16}/></button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
        {users.length === 0 && !loading && <div className="text-center py-8 text-gray-400">Không tìm thấy user nào.</div>}
    </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[60] backdrop-blur-sm">
            <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-in zoom-in duration-200 overflow-y-auto max-h-[90vh]">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold">{editingUser ? 'Sửa thông tin User' : 'Tạo tài khoản mới'}</h3>
                    <button onClick={() => setIsModalOpen(false)}><X size={20} className="text-gray-400 hover:text-gray-600"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {!editingUser && (
                        <div className="p-3 bg-blue-50 text-blue-700 text-xs rounded-lg border border-blue-100 mb-2">
                            Mật khẩu sẽ được mã hóa (Hash) tự động trước khi lưu vào Database.
                        </div>
                    )}
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium mb-1">Username</label>
                            <input type="text" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium mb-1">Quyền hạn</label>
                            <select className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" 
                                value={formData.role_id} onChange={e => setFormData({...formData, role_id: e.target.value})}>
                                {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Email</label>
                        <input type="email" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Tên hiển thị</label>
                        <input type="text" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                            value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
                    </div>

                    {!editingUser && (
                        <div>
                            <label className="block text-sm font-medium mb-1">Mật khẩu</label>
                            <input type="password" required className="w-full border rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-indigo-500"
                                placeholder="Nhập mật khẩu..."
                                value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
                        </div>
                    )}

                    <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
                        <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg">Hủy</button>
                        <button type="submit" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow">
                            {editingUser ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default UsersManager;