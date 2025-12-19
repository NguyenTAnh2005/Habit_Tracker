from datetime import date, timedelta
from typing import List
from app.database import models

# Hàm tính Streak (Có logic Cầu nối: SKIPPED/PARTIAL không làm gãy chuỗi)
def calculate_current_streak(logs: List[models.HabitLog]) -> int:
    if not logs: return 0

    # 1. Sắp xếp log từ Mới -> Cũ
    sorted_logs = sorted(logs, key=lambda x: x.record_date, reverse=True)
    
    # 2. Map dữ liệu theo ngày (để xử lý việc 1 ngày log nhiều lần)
    # Ưu tiên status: COMPLETED > PARTIAL > SKIPPED > FAILED
    day_map = {}
    priority = {"COMPLETED": 3, "PARTIAL": 2, "SKIPPED": 2, "FAILED": 1}
    
    for log in sorted_logs:
        d = log.record_date
        # Logic chọn status tốt nhất trong ngày
        if d not in day_map or priority.get(log.status, 0) > priority.get(day_map[d], 0):
            day_map[d] = log.status

    # 3. Thuật toán đếm ngược
    dates = sorted(day_map.keys(), reverse=True)
    today = date.today()
    yesterday = today - timedelta(days=1)
    
    # Check ngày bắt đầu: Nếu log mới nhất cách xa quá 2 ngày -> Reset về 0
    if not dates or dates[0] < yesterday:
        return 0

    streak = 0
    check_date = dates[0] # Bắt đầu từ ngày log mới nhất
    
    for d in dates:
        # Nếu ngày đang xét bị đứt quãng so với ngày mong đợi -> Dừng
        if d != check_date:
            break
            
        status = day_map[d]
        
        # --- LOGIC CỐT LÕI ---
        if status == "COMPLETED":
            streak += 1  # Cộng điểm
        elif status in ["PARTIAL", "SKIPPED"]:
            pass         # Cầu nối: Không cộng, nhưng không break loop
        else: 
            break        # FAILED -> Gãy chuỗi
            
        # Lùi ngày kiểm tra về quá khứ
        check_date = check_date - timedelta(days=1)
            
    return streak