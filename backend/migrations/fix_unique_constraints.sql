-- Drop existing constraints
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_steam_id;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_riot_id;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_ea_username;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_username;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_email;

-- Re-add constraints that allow NULL values
ALTER TABLE users ADD CONSTRAINT uni_users_steam_id UNIQUE (steam_id) WHERE steam_id IS NOT NULL AND steam_id != '';
ALTER TABLE users ADD CONSTRAINT uni_users_riot_id UNIQUE (riot_id) WHERE riot_id IS NOT NULL AND riot_id != '';
ALTER TABLE users ADD CONSTRAINT uni_users_ea_username UNIQUE (ea_username) WHERE ea_username IS NOT NULL AND ea_username != '';

-- Add proper unique constraints for username and email
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_username;
ALTER TABLE users DROP CONSTRAINT IF EXISTS uni_users_email;
ALTER TABLE users ADD CONSTRAINT uni_users_username UNIQUE (username);
ALTER TABLE users ADD CONSTRAINT uni_users_email UNIQUE (email);
