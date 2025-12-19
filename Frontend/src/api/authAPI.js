import axiosClient from './axiosClient';

const authApi = {
  // Hàm đăng ký
  register(data) {
    const url = '/users/register';
    return axiosClient.post(url, data);
  },

  // Hàm đăng nhập
  login(data) {
    // Lưu ý: Backend dùng OAuth2PasswordRequestForm nên cần gửi dạng Form Data
    const url = '/login';
    
    // Chuyển đổi JSON thành Form Data (x-www-form-urlencoded)
    const formData = new URLSearchParams();
    formData.append('username', data.email); // Backend map 'username' với email
    formData.append('password', data.password);

    return axiosClient.post(url, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });
  },

  // Hàm lấy thông tin user hiện tại (Me)
  getMe() {
    return axiosClient.get('/users/me');
  }
};

export default authApi;