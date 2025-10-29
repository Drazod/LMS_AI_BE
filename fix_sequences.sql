-- Fix sequences for orders and enrollments tables
-- Run this if you encounter "duplicate key value violates unique constraint" errors

-- Fix orders sequence
SELECT setval('orders_order_id_seq', 
  COALESCE((SELECT MAX(order_id) FROM orders), 0) + 1, 
  false
);

-- Fix enrollments sequence (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments') THEN
    PERFORM setval('enrollments_enrollment_id_seq', 
      COALESCE((SELECT MAX(enrollment_id) FROM enrollments), 0) + 1, 
      false
    );
  END IF;
END $$;

-- Fix order_items if it has a sequence (it shouldn't, but just in case)
-- order_items uses composite primary key, so no sequence needed

-- Verify sequences are correct
SELECT 
  'orders' as table_name,
  last_value as current_sequence_value,
  (SELECT MAX(order_id) FROM orders) as max_id_in_table
FROM orders_order_id_seq
UNION ALL
SELECT 
  'enrollments' as table_name,
  last_value as current_sequence_value,
  (SELECT MAX(enrollment_id) FROM enrollments) as max_id_in_table
FROM enrollments_enrollment_id_seq
WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'enrollments');

-- Done!
-- You should see that current_sequence_value is greater than max_id_in_table
