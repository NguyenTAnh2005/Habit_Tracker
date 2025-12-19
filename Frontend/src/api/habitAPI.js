import axiosClient from './axiosClient';

const habitApi = {
  // ============================================================
  // 1. QUẢN LÝ THÓI QUEN (HABITS CRUD)
  // ============================================================

  // Lấy tất cả thói quen (hỗ trợ filter: search, category_id) - Dùng cho trang Quản lý
  getAllHabits(params) {
    return axiosClient.get('/habits', { params });
  },

  // Lấy danh sách thói quen CẦN LÀM theo ngày cụ thể (date_str) - Dùng cho Dashboard
  getHabitsByDate(dateStr) {
    return axiosClient.get('/habits/today', { params: { date_str: dateStr } });
  },

  // Tạo thói quen mới
  createHabit(data) {
    return axiosClient.post('/habits/create', data);
  },

  // Cập nhật thông tin thói quen
  updateHabit(id, data) {
    return axiosClient.put(`/habits/update/${id}`, data);
  },

  // Xóa thói quen
  deleteHabit(id) {
    return axiosClient.delete(`/habits/delete/${id}`);
  },

  // Lấy danh sách danh mục (Category)
  getCategories() {
    return axiosClient.get('/categories');
  },

  // ============================================================
  // 2. QUẢN LÝ NHẬT KÝ & CHECK-IN (LOGS)
  // ============================================================

  // Lấy danh sách Log đã check-in theo ngày cụ thể (date_str)
  getLogsByDate(dateStr) {
    return axiosClient.get('/logs/today', { params: { date_str: dateStr } });
  },

  // Tạo mới Check-in
  checkIn(data) {
    return axiosClient.post('/logs/', data);
  },

  // Cập nhật Log (Sửa lại kết quả/trạng thái của log cũ)
  updateLog(logId, data) {
    return axiosClient.put(`/logs/update/${logId}`, data);
  },

  // Xóa Log (Undo check-in)
  deleteLog(logId) {
    return axiosClient.delete(`/logs/${logId}`);
  },

  // Lấy lịch sử log của MỘT thói quen cụ thể (kèm phân trang, lọc ngày)
  getHabitLogs(habitId, params) {
    // params: { skip, limit, from_date, to_date }
    return axiosClient.get(`/logs/habit/${habitId}`, { params });
  },

  // Lấy lịch sử log tổng quát của User (cho trang Stats hoặc History chung)
  getHistory(params) {
    return axiosClient.get('/logs/user/history', { params });
  },

  // ============================================================
  // 3. THỐNG KÊ (STATS)
  // ============================================================

  // Lấy thống kê % hoàn thành theo ngày (date_str)
  getDailyStats(dateStr) {
    return axiosClient.get('/logs/stats/today', { params: { date_str: dateStr } });
  },

  // Lấy chỉ số Streak hiện tại của 1 habit
  getHabitStreak(habitId) {
    return axiosClient.get(`/habits/${habitId}/streaks`);
  },
  // Đồng bộ tự động các habit chưa check-in thành FAIL trong quá khứ
  syncAutoFail(dateStr) {
    return axiosClient.post('/logs/auto-fail', null, { params: { date_str: dateStr } });
  },
};

export default habitApi;