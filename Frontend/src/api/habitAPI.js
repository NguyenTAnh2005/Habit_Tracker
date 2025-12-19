import axiosClient from './axiosClient';

const habitApi = {
  // 1. Lấy danh sách thói quen
  getAllHabits(params) {
    return axiosClient.get('/habits', { params });
  },

  // 2. Lấy thống kê ngày hôm nay (Backend logs prefix là /logs)
  getDailyStats() {
    return axiosClient.get('/logs/stats/today');
  },

  // 3. Check-in (Tạo log mới)
  checkIn(data) {
    return axiosClient.post('/logs', data);
  },

  // 4. Tạo thói quen mới
  createHabit(data){
    return axiosClient.post('/habits/create', data);
  },

  // 5. Lấy danh mục
  getCategories() {
    return axiosClient.get('/categories');
  },

  // 6. Lấy log hôm nay (Để biết cái nào đã làm rồi)
  getTodaysLogs() {
    return axiosClient.get('/logs/today');
  },

  // 7. Cập nhật thói quen
  updateHabit(id, data) {
    return axiosClient.put(`/habits/update/${id}`, data);
  },

  // 8. Xóa thói quen
  deleteHabit(id) {
    return axiosClient.delete(`/habits/delete/${id}`);
  },

  // 9. Xóa Log (Undo check-in) - MỚI THÊM
  deleteLog(logId) {
    return axiosClient.delete(`/logs/${logId}`);
  }
};

export default habitApi;