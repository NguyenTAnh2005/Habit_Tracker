import axiosClient from './axiosClient';

const userApi = {
  // Cập nhật thông tin cá nhân (Tên, Email)
  updateProfile(data) {
    const url = '/users/me';
    return axiosClient.put(url, data);
  },

  // Đổi mật khẩu (Tính năng mở rộng sau này)
  changePassword(data) {
    const url = '/users/change-password';
    return axiosClient.put(url, data);
  },
  //[ADMIN] Lấy danh sách user (có tìm kiếm, phân trang)
  getAllUsers(params) {
    return axiosClient.get('/users', { params });
  },

  // [ADMIN] Update thông tin user khác (để đổi role, khóa nick...)
  updateUserByAdmin(userId, data) {
    return axiosClient.put(`/users/admin/update/${userId}`, data);
  },

  // [ADMIN] Xóa user
  deleteUser(userId) {
    return axiosClient.delete(`/users/${userId}`);
  }
};

export default userApi;