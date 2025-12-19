import axios from 'axios';
import axiosClient from './axiosClient';

const userApi = {
  // Cập nhật thông tin cá nhân (Tên, Email)
  updateProfile(data) {
    const url = '/users/me';
    return axiosClient.put(url, data);
  },
  // Xác thực mật khẩu hiện tại
  verifyPassword(password){
    return axiosClient.post('/users/verify-password', {password: password});
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
  },
  // Quên mật khẩu - Gửi email chứa mật khẩu mới
  forgotPassword(email) {
    return axiosClient.post('/users/forgot_password', { email });
  }
};

export default userApi;