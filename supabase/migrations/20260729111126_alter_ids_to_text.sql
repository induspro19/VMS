-- Alter push_subscriptions
ALTER TABLE public.push_subscriptions 
ALTER COLUMN employee_id TYPE text;

-- Alter employee_notifications
ALTER TABLE public.employee_notifications
ALTER COLUMN employee_id TYPE text,
ALTER COLUMN visitor_id TYPE text;
