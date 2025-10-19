-- Add user_id column to chat_sessions table
ALTER TABLE chat_sessions ADD COLUMN user_id BIGINT;

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
    id BIGSERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    display_name VARCHAR(255) NOT NULL,
    avatar VARCHAR(10),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add foreign key constraint
ALTER TABLE chat_sessions ADD CONSTRAINT fk_chat_sessions_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;