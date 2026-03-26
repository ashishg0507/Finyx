-- Finyx MySQL database schema
-- Run this file to create all required tables for the current Sequelize models.
--
-- Before running:
-- 1) Update DB name in `USE finyx;` to match `server/.env -> DB_NAME`.
-- 2) Ensure your MySQL user has permission to CREATE/ALTER tables.
-- 3) This schema includes the `subscriptions` table added for Razorpay payments.

CREATE DATABASE IF NOT EXISTS finyx CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE finyx;

-- -----------------------
-- users
-- -----------------------
CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  email VARCHAR(255) NOT NULL,
  passwordHash VARCHAR(255) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB;

-- -----------------------
-- transactions
-- -----------------------
CREATE TABLE IF NOT EXISTS transactions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId INT UNSIGNED NOT NULL,
  type ENUM('income','expense') NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description VARCHAR(255) NOT NULL,
  category VARCHAR(64) NOT NULL,
  date DATE NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_transactions_userId_date (userId, date),
  CONSTRAINT fk_transactions_user
    FOREIGN KEY (userId) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------
-- budgets
-- -----------------------
CREATE TABLE IF NOT EXISTS budgets (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId INT UNSIGNED NOT NULL,
  monthKey VARCHAR(7) NOT NULL, -- YYYY-MM
  category VARCHAR(64) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_budgets_user_month_category (userId, monthKey, category),
  CONSTRAINT fk_budgets_user
    FOREIGN KEY (userId) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------
-- goals
-- -----------------------
CREATE TABLE IF NOT EXISTS goals (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId INT UNSIGNED NOT NULL,
  name VARCHAR(255) NOT NULL,
  targetAmount DECIMAL(12,2) NOT NULL,
  currentAmount DECIMAL(12,2) NOT NULL DEFAULT 0,
  dueDate DATE NULL,
  priority ENUM('low','medium','high') NOT NULL DEFAULT 'medium',
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goals_userId (userId),
  CONSTRAINT fk_goals_user
    FOREIGN KEY (userId) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------
-- goal_contributions
-- -----------------------
CREATE TABLE IF NOT EXISTS goal_contributions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  goalId INT UNSIGNED NOT NULL,
  userId INT UNSIGNED NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  date DATE NOT NULL,
  note VARCHAR(255) NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_goal_contrib_userId_goalId_date (userId, goalId, date),
  CONSTRAINT fk_goal_contributions_goal
    FOREIGN KEY (goalId) REFERENCES goals (id)
    ON DELETE CASCADE,
  CONSTRAINT fk_goal_contributions_user
    FOREIGN KEY (userId) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- -----------------------
-- subscriptions (Razorpay)
-- -----------------------
CREATE TABLE IF NOT EXISTS subscriptions (
  id INT UNSIGNED NOT NULL AUTO_INCREMENT,
  userId INT UNSIGNED NOT NULL,
  planId VARCHAR(32) NOT NULL,
  status ENUM('created','paid') NOT NULL DEFAULT 'created',
  razorpayOrderId VARCHAR(128) NOT NULL,
  razorpayPaymentId VARCHAR(128) NULL,
  razorpaySignature VARCHAR(255) NULL,
  isActive TINYINT(1) NOT NULL DEFAULT 0,
  paidAt DATETIME NULL,
  createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_subscriptions_razorpayOrderId (razorpayOrderId),
  KEY idx_subscriptions_userId_isActive_planId (userId, isActive, planId),
  CONSTRAINT fk_subscriptions_user
    FOREIGN KEY (userId) REFERENCES users (id)
    ON DELETE CASCADE
) ENGINE=InnoDB;

-- Helpful sanity check:
-- SHOW TABLES;
-- DESCRIBE users;

