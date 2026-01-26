# Fix Auto-Generated Category Milestone Badges

## Problem
The stored procedure `award_category_tier_badge` is automatically creating badge entries in the `user_rewards` table with names like:
- "Beaches Explorer" (Bronze tier - 33%)
- "Malay Traditional Adventurer" (Silver tier - 66%)
- "Malay Traditional Master" (Gold tier - 100%)

These are **category milestones**, not badges, and should NOT be in the `user_rewards` table. They should only exist as tier flags (`bronze_unlocked`, `silver_unlocked`, `gold_unlocked`) in the `user_category_progress` table.

## Why This Happened
The stored procedure was designed to automatically insert badge entries when users unlock category tiers. However, your UI already handles category milestones through the `CategoryMilestone` component which reads from `user_category_progress`.

## Solution (Step-by-Step)

### Step 1: Backup and View Current Data
Run this in phpMyAdmin:
```sql
-- See what will be affected
SELECT id, user_id, reward_name, category, earned_date
FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold';
```

### Step 2: Run the Cleanup Migration
Open `2026-01-26_remove_auto_category_badges.sql` in phpMyAdmin and:
1. Execute the backup section (creates backup table)
2. Review the SELECT statement output
3. **Uncomment and run the DELETE statement** to remove auto-generated badges

### Step 3: Fix the Stored Procedure
Open `2026-01-26_fix_category_badge_procedure.sql` in phpMyAdmin and:
1. Run the entire script
2. This will replace the old procedure with a new one that ONLY updates tier flags
3. No more auto-badge creation!

### Step 4: Verify the Fix
```sql
-- Check that badges are deleted
SELECT COUNT(*) as remaining_auto_badges
FROM user_rewards
WHERE reward_identifier LIKE 'badge_%_bronze'
   OR reward_identifier LIKE 'badge_%_silver'
   OR reward_identifier LIKE 'badge_%_gold';
-- Should return 0

-- Check that category progress is still intact
SELECT user_id, category, bronze_unlocked, silver_unlocked, gold_unlocked, completion_percentage
FROM user_category_progress;
-- Should show your tier progress correctly

-- Verify procedure was updated
SHOW CREATE PROCEDURE award_category_tier_badge;
```

### Step 5: Test in Your App
1. Log in to your frontend app
2. Go to the Rewards page
3. You should see:
   - **CategoryMilestone component** showing tier badges (Bronze/Silver/Gold) ✅
   - **BadgeCollection component** showing ONLY manually created badges (not category milestones) ✅

## What Changes

### Before:
- Category tiers stored in TWO places:
  - `user_category_progress` table (tier flags)
  - `user_rewards` table (auto-generated badges) ❌
- BadgeCollection was empty because these had `reward_type = 'badge'` but weren't from admin panel
- Confusing duplicate data

### After:
- Category tiers stored in ONE place:
  - `user_category_progress` table ONLY ✅
- CategoryMilestone component displays them correctly
- BadgeCollection shows only admin-created badges
- Clean separation of concerns

## Rollback (If Needed)
If something goes wrong, you can restore from backup:
```sql
-- Restore deleted badges
INSERT INTO user_rewards (id, user_id, reward_type, reward_identifier, reward_name, reward_description, category, earned_date)
SELECT id, user_id, reward_type, reward_identifier, reward_name, reward_description, category, earned_date
FROM user_rewards_category_badges_backup;
```

## Questions?
- Category milestones will still display in the UI (via CategoryMilestone component)
- Only admin-created badges from the Rewards admin panel will show in BadgeCollection
- The tier unlock functionality remains the same, just without duplicate badge entries

