-- Add family_id to track refresh tokens belonging to the same session.
ALTER TABLE refresh_tokens
ADD COLUMN family_id UUID;

-- Give existing tokens individual family IDs.
UPDATE refresh_tokens
SET family_id = gen_random_uuid()
WHERE family_id IS NULL;

-- Require every refresh token to belong to a family.
ALTER TABLE refresh_tokens
ALTER COLUMN family_id SET NOT NULL;

-- Index family lookups for efficient revocation.
CREATE INDEX idx_refresh_tokens_family_id
ON refresh_tokens(family_id);
