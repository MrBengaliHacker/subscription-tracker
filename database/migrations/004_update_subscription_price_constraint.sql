ALTER TABLE subscriptions
DROP CONSTRAINT subscriptions_price_check;

ALTER TABLE subscriptions
ADD CONSTRAINT subscriptions_price_check
CHECK (price > 0);