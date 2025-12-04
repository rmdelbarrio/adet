DROP TABLE IF EXISTS positions;
DROP TABLE IF EXISTS users;

-- NEW: Standardizing on 'id' as PRIMARY KEY, 'password' (containing hash), and adding 'role'
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL, -- Storing hashed password (as used in AuthService)
    role ENUM('user', 'admin') NOT NULL DEFAULT 'user', -- Adding role column
    refresh_token TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_username (username),
    INDEX idx_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS positions (
    position_id INT AUTO_INCREMENT PRIMARY KEY,
    position_code VARCHAR(100) NOT NULL UNIQUE,
    position_name VARCHAR(300) NOT NULL,
    min_salary DECIMAL(10,2),
    department VARCHAR(200),
    user_id INT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE, -- Referencing new 'id' column
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
