-- ============================================================
-- 002_seed_categories.sql  –  Default Thai categories
-- is_default = true, user_id = NULL (visible to all users via RLS)
-- ============================================================

INSERT INTO categories (name, name_th, type, icon, color, is_default, user_id) VALUES

-- ── Expense ──────────────────────────────────────────────────
('food',          'อาหาร',        'expense', 'utensils',        '#FFB800', true, NULL),
('transport',     'เดินทาง',       'expense', 'bus',             '#5AC8FA', true, NULL),
('shopping',      'ช้อปปิ้ง',      'expense', 'shopping-bag',    '#AF52DE', true, NULL),
('entertainment', 'บันเทิง',       'expense', 'film',            '#FF3478', true, NULL),
('health',        'สุขภาพ',        'expense', 'heart',           '#FF3D30', true, NULL),
('education',     'การศึกษา',      'expense', 'book',            '#34C759', true, NULL),
('rent',          'ค่าเช่า',       'expense', 'home',            '#FF9500', true, NULL),
('phone',         'โทรศัพท์',      'expense', 'smartphone',      '#5856D6', true, NULL),
('other_expense', 'อื่นๆ',         'expense', 'more-horizontal', '#8E8E93', true, NULL),

-- ── Income ───────────────────────────────────────────────────
('salary',        'เงินเดือน',     'income',  'briefcase',       '#34C759', true, NULL),
('extra_income',  'รายได้พิเศษ',   'income',  'star',            '#FFB800', true, NULL),
('refund',        'คืนเงิน',       'income',  'refresh-cw',      '#5AC8FA', true, NULL),
('other_income',  'อื่นๆ รายรับ',  'income',  'plus-circle',     '#30D158', true, NULL);
