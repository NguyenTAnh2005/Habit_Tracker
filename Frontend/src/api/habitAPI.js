import axiosClient from './axiosClient';

const habitApi = {
  // 1. Lấy danh sách thói quen (Có hỗ trợ params search, category_id)
  getAllHabits(params) {
    return axiosClient.get('/habits', { params });
  },

  // 2. Lấy danh sách thói quen CẦN LÀM HÔM NAY (API Mới)
  getHabitsToday() {
    return axiosClient.get('/habits/today');
  },

  // 3. Lấy thống kê ngày
  getDailyStats() {
    return axiosClient.get('/logs/stats/today');
  },

  // 4. Check-in
  checkIn(data) {
    return axiosClient.post('/logs/', data);
  },

  // 5. Tạo mới
  createHabit(data){
    return axiosClient.post('/habits/create', data);
  },

  // 6. Lấy danh mục
  getCategories() {
    return axiosClient.get('/categories');
  },

  // 7. Lấy log hôm nay
  getTodaysLogs() {
    return axiosClient.get('/logs/today');
  },

  // 8. Cập nhật
  updateHabit(id, data) {
    return axiosClient.put(`/habits/update/${id}`, data);
  },

  // 9. Xóa thói quen
  deleteHabit(id) {
    return axiosClient.delete(`/habits/delete/${id}`);
  },

  // 10. Xóa Log (Undo check-in)
  deleteLog(logId) {
    return axiosClient.delete(`/logs/${logId}`);
  },

  // 11. Lấy lịch sử
  getHistory(params) {
    return axiosClient.get('/logs/user/history', { params });
  },
  // 12. Lấy chỉ số Streak các Habit 
  // 👇 THÊM HÀM NÀY: Lấy thống kê (Streak) của 1 habit
  getHabitStreak(habitId) {
    return axiosClient.get(`/habits/${habitId}/streaks`);
  },
  // 13.  Lấy lịch sử chi tiết của 1 habit (kèm filter date)
  getHabitLogs(habitId, params) {
    // params bao gồm: { skip, limit, from_date, to_date }
    return axiosClient.get(`/logs/habit/${habitId}`, { params });
  },
};

export default habitApi;