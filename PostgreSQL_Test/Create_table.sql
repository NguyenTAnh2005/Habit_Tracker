-- ============================================================
-- PHẦN 1: TẠO BẢNG (CREATE TABLES)
-- ============================================================

-- 1. Bảng ROLES
CREATE TABLE IF NOT EXISTS roles (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    "desc" VARCHAR -- "desc" là từ khóa, cần để trong ngoặc kép
);

-- 2. Bảng HABIT CATEGORIES
CREATE TABLE IF NOT EXISTS habit_categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR NOT NULL UNIQUE,
    "desc" VARCHAR
);

-- 3. Bảng MOTIVATION QUOTES
CREATE TABLE IF NOT EXISTS motivation_quotes (
    id SERIAL PRIMARY KEY,
    quote VARCHAR NOT NULL,
    author VARCHAR
);

-- 4. Bảng USERS
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR NOT NULL UNIQUE,
    full_name VARCHAR NOT NULL,
    password VARCHAR NOT NULL,
    email VARCHAR NOT NULL UNIQUE,
    role_id INTEGER NOT NULL REFERENCES roles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Bảng USER TOKENS
CREATE TABLE IF NOT EXISTS user_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 6. Bảng HABITS
CREATE TABLE IF NOT EXISTS habits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    category_id INTEGER NOT NULL REFERENCES habit_categories(id),
    name VARCHAR NOT NULL,
    "desc" VARCHAR,
    frequency INTEGER[] NOT NULL, -- Kiểu mảng số nguyên của Postgres
    unit VARCHAR,
    target_value DOUBLE PRECISION,
    color VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bảng HABIT LOGS
CREATE TABLE IF NOT EXISTS habit_logs (
    id SERIAL PRIMARY KEY,
    habit_id INTEGER NOT NULL REFERENCES habits(id) ON DELETE CASCADE,
    value DOUBLE PRECISION,
    status VARCHAR NOT NULL,
    record_date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Đảm bảo mỗi ngày chỉ có 1 log cho 1 thói quen (tránh duplicate)
    CONSTRAINT unique_log_per_day UNIQUE (habit_id, record_date)
);