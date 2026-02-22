#📅 Developed during Semester 1 of my third year at university.

# 📌 Habit Tracker – Ứng dụng theo dõi thói quen

## 📖 Giới thiệu
**Habit Tracker** là một ứng dụng giúp người dùng theo dõi các thói quen sinh hoạt hằng ngày, biết được hôm nay cần làm gì, từ đó kiểm soát và cải thiện thói quen trong cuộc sống hằng ngày một cách hiệu quả.

---

## 🎓 Mục đích học thuật
- Đồ án cuối kỳ môn **Phát triển ứng dụng mã nguồn mở**

---

## 👥 Đối tượng sử dụng
- Tất cả mọi người có nhu cầu quản lý và theo dõi thói quen cá nhân

---

## 🎯 Mục tiêu dự án
- Theo dõi và quản lý thói quen hằng ngày  
- Ghi nhận lịch sử thực hiện thói quen (check-in)  
- Cung cấp thống kê trực quan giúp đánh giá mức độ duy trì thói quen  
- Xây dựng lối sống khoa học và kỷ luật hơn  

---

## 🛠️ Công nghệ sử dụng

### 🔹 Frontend
- ReactJS  
- Vite  
- Tailwind CSS  
- Axios  
- React Router DOM  
- Lucide React  
- Recharts  
- React Calendar Heatmap   
- React Tooltip  

### 🔹 Backend
- FastAPI  
- JWT Authentication  
- SQLAlchemy  
- Alembic (Database Migration)

### 🔹 Database
- PostgreSQL  

### 🔹 Deploy
- Backend & Database: Render  
- Frontend: Vercel  

> ⚠️ Link web app:  https://habit-tracker-kappa-gold.vercel.app/

---

## ✨ Chức năng chính

### 👤 Người dùng vãng lai
- Đăng ký tài khoản  

### 👤 Người dùng (User)
- Đăng nhập  
- Quên mật khẩu  
- CRUD thói quen (Habit)  
- Check-in thói quen hằng ngày  
- Chỉnh sửa log cũ  
- Xem thống kê hoàn thành  
- Xem biểu đồ heatmap  
- Xem & cập nhật thông tin cá nhân  

### 👑 Quản trị viên (Admin)
- CRUD người dùng (không truy cập mật khẩu khi cập nhật)  
- CRUD danh mục thói quen  
- CRUD câu nói tạo động lực  
- CRUD quyền (Role)  
- Xem danh sách thói quen của người dùng  

✅ **Trạng thái:** Gần như hoàn thành các chức năng cốt lõi trên

---

## 🏗️ Kiến trúc hệ thống
- Mô hình **Client – Server**  
- Frontend & Backend giao tiếp qua **REST API**  
- Frontend sử dụng **Axios**  
- Backend xử lý nghiệp vụ & xác thực bằng **JWT**

---

## 📂 Cấu trúc thư mục

```txt
Habit_Tracker/
├── Backend/
│   ├── main.py                 # Entry point FastAPI
│   ├── requirements.txt        # Thư viện backend
│   ├── alembic.ini             # Cấu hình migration
│   ├── alembic/
│   │   └── versions/           # File migration database
│   └── app/
│       ├── core/               # Cấu hình, logic chung, utils
│       ├── database/           # Kết nối DB, models, CRUD
│       │   └── crud/           # Các thao tác CRUD
│       ├── routers/            # API endpoints
│       └── schemas/            # Pydantic schemas
│
├── Frontend/
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   ├── tailwind.config.js
│   ├── router.jsx
│   ├── public/
│   └── src/
│       ├── api/                # Gọi API backend
│       ├── components/         # Component dùng chung
│       │   └── admin/          # Component cho Admin
│       ├── layout/             # Layout tổng
│       ├── pages/              # Các trang chính
│       └── App.jsx
│
├── PostgreSQL_Test/             # Script test dữ liệu DB
├── README.md
└── Thiet_ke_DB.xlsx             # Thiết kế database


---
```

## ⚙️ Hướng dẫn cài đặt & chạy dự án

### 🔹 Backend

#### Yêu cầu
- Python **3.10+**
- Fast Api standard
- PostgreSQL

#### Cài đặt
pip install -r requirements.txt

#### Chạy server
uvicorn main:app --reload

---

### 🔹 Frontend

#### Yêu cầu
- NodeJS **v24.11.1**

#### Cài đặt
npm install

#### Chạy dự án
npm run dev

---

## 🔐 Biến môi trường

### Backend (.env)
DATABASE_URL=postgresql://...
SECRET_KEY=your_secret_key

MAIL_USERNAME=your_email  
MAIL_PASSWORD=your_app_password  
MAIL_FROM=your_email  
MAIL_PORT=587  
MAIL_SERVER=smtp.gmail.com  

### Frontend (.env)
VITE_API_URL=đường dẫn backend chạy

⚠️ **Không commit thông tin nhạy cảm (email, mật khẩu) lên GitHub**

---

## 🔌 API tiêu biểu

- GET `/habits/today` – Task cần làm hôm nay
- GET `/logs/stats/today` – Thống kê hoàn thành
- GET `/habits/{habit_id}/streaks` – Streak thói quen
- POST `/login` – Đăng nhập (JWT)

---

## 🗄️ Database Design

Hệ thống gồm **7 bảng** (trong đó có **1 bảng dư**):

- users
- roles
- habit_category
- habits
- habit_logs
- motivation_quotes
- user_token ❌ *(đã chuyển sang JWT)*

---

## 🚧 Tình trạng & hướng phát triển

### ✅ Hiện tại
- Hoàn thành toàn bộ chức năng cơ bản

### 🔜 Phát triển trong tương lai
- Nhắc nhở thói quen
- Chia sẻ thói quen
- Tích hợp mạng xã hội
- Thống kê nâng cao theo tuần / tháng

---

## 👨‍💻 Tác giả

- **Nguyễn Tuấn Anh**
- **Lê Ngọc Sang**

🎓 Sinh viên **Đại học Bình Dương**  
📅 Khóa **2023 – 2027**

---
Nội dung được style bởi CHAT GPT
