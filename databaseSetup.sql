-- Create the database
CREATE DATABASE IF NOT EXISTS FitFlex;
USE FitFlex;

-- Create the users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    username VARCHAR(50) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    Goals JSON DEFAULT NULL
);

-- Create the fitness_details table
CREATE TABLE IF NOT EXISTS fitness_details (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    water_intake_ml INT DEFAULT 0,
    workout_minutes INT DEFAULT 0,
    blood_sugar_level FLOAT,
    weight FLOAT,
    calories_intake INT DEFAULT 0,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Optional: add indexes for faster lookups
CREATE INDEX idx_users_email ON users (email);
CREATE INDEX idx_fitness_user_id ON fitness_details (user_id);
