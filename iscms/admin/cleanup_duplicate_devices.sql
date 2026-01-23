-- Clean up duplicate devices
-- This removes duplicate CGM and Smart Scale devices based on serial number

USE iscms_db;

-- Show current duplicates
SELECT 'BEFORE CLEANUP - CGM Devices:' as Status;
SELECT serial_number, COUNT(*) as count 
FROM cgm_devices 
GROUP BY serial_number 
HAVING count > 1;

SELECT 'BEFORE CLEANUP - Smart Scales:' as Status;
SELECT serial_number, COUNT(*) as count 
FROM smart_scale_devices 
GROUP BY serial_number 
HAVING count > 1;

-- Delete duplicate CGM devices (keep only the latest one for each serial number)
DELETE cd1 FROM cgm_devices cd1
INNER JOIN cgm_devices cd2 
WHERE cd1.serial_number = cd2.serial_number 
AND cd1.device_id < cd2.device_id;

-- Delete duplicate Smart Scale devices (keep only the latest one for each serial number)
DELETE sd1 FROM smart_scale_devices sd1
INNER JOIN smart_scale_devices sd2 
WHERE sd1.serial_number = sd2.serial_number 
AND sd1.device_id < sd2.device_id;

-- Show results after cleanup
SELECT 'AFTER CLEANUP - CGM Devices:' as Status;
SELECT COUNT(*) as total FROM cgm_devices;
SELECT * FROM cgm_devices ORDER BY user_id;

SELECT 'AFTER CLEANUP - Smart Scales:' as Status;
SELECT COUNT(*) as total FROM smart_scale_devices;
SELECT * FROM smart_scale_devices ORDER BY user_id;

SELECT '✅ Cleanup complete! Duplicates removed.' as Status;
