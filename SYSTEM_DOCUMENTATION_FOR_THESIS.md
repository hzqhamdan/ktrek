# K-TREK System Documentation for Thesis (Chapter 4: Results and Discussion)

**System Name**: K-Trek - Location-Based Gamified Tourism Web Application for Kelantan Cultural Heritage

**Documentation Date**: January 26, 2026

**Purpose**: This document provides a comprehensive technical overview of the K-Trek system for thesis documentation purposes, specifically for Chapter 4 (Results and Discussion).

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [System Architecture Overview](#2-system-architecture-overview)
3. [Frontend Implementation](#3-frontend-implementation)
4. [Backend Implementation](#4-backend-implementation)
5. [Database Design and Schema](#5-database-design-and-schema)
6. [Authentication and User Management](#6-authentication-and-user-management)
7. [Gamification and Rewards System](#7-gamification-and-rewards-system)
8. [Task Types and Implementation](#8-task-types-and-implementation)
9. [Location-Based Features](#9-location-based-features)
10. [Admin Panel and Management System](#10-admin-panel-and-management-system)
11. [APIs and Third-Party Integrations](#11-apis-and-third-party-integrations)
12. [Security Implementation](#12-security-implementation)
13. [Performance Optimization](#13-performance-optimization)
14. [Testing and Quality Assurance](#14-testing-and-quality-assurance)
15. [Deployment Architecture](#15-deployment-architecture)
16. [System Features Summary](#16-system-features-summary)
17. [Technical Achievements](#17-technical-achievements)
18. [Challenges and Solutions](#18-challenges-and-solutions)

---

## 1. Executive Summary

### 1.1 System Overview

K-Trek is a location-based gamified web application designed to promote Kelantan's cultural heritage tourism through interactive digital experiences. The system transforms traditional tourism into an engaging, educational adventure by combining geolocation technology, gamification mechanics, and cultural storytelling.

### 1.2 Core Objectives

1. **Cultural Preservation**: Digitally document and promote Kelantan's cultural attractions
2. **Tourist Engagement**: Increase visitor interaction through gamification
3. **Educational Impact**: Provide informative content about cultural heritage
4. **Accessibility**: Deliver experiences through responsive web technology (no app installation required)
5. **Sustainable Tourism**: Encourage repeated visits and deeper exploration

### 1.3 Key Statistics

- **Technology Stack**: React + Vite frontend, PHP backend, MySQL database
- **Attractions Supported**: Multiple categories (Historical, Religious, Nature, Cultural)
- **Task Types**: 7 interactive task types (Quiz, Check-in, Direction, Observation Match, Count Confirm, Time-Based, Photo)
- **Reward System**: XP/EP progression, badges, titles, category milestones
- **User Roles**: Tourist users, Attraction Managers, Superadmins
- **Deployment**: Web-based (mobile-first responsive design)

### 1.4 Target Users

1. **Primary**: Domestic and international tourists visiting Kelantan
2. **Secondary**: Local residents exploring their heritage
3. **Tertiary**: Educational institutions for cultural field trips

### 1.5 System Success Metrics

- User engagement through task completion rates
- Cultural knowledge improvement through quiz scores
- Attraction visit verification through QR check-ins
- User retention through gamification progression
- Content coverage across Kelantan''s cultural sites

---

## 2. System Architecture Overview

### 2.1 Three-Tier Architecture

K-Trek implements a modern three-tier web application architecture:

**Presentation Tier (React + Vite Frontend)**
- Responsive UI Components
- State Management (Zustand)
- Client-side Routing

**Application Tier (PHP Backend + RESTful APIs)**
- Authentication Middleware
- Business Logic
- Reward Calculation

**Data Tier (MySQL Database)**
- Relational Schema
- Stored Procedures
- Triggers for Automation

### 2.2 Technology Stack

#### Frontend Technologies
- **Framework**: React 18.3.1
- **Build Tool**: Vite 6.0.11 (fast development server with HMR)
- **Styling**: Tailwind CSS 4.1.17 (utility-first CSS framework)
- **State Management**: Zustand (lightweight state management)
- **Routing**: React Router v6
- **HTTP Client**: Axios for API communication
- **Maps**: Mapbox GL JS v3.11.0
- **QR Scanning**: Html5-QRCode library
- **Icons**: Lucide React v0.553.0
- **Animations**: Framer Motion v12.23.26

#### Backend Technologies
- **Language**: PHP 7.4+
- **Database Driver**: PDO (PHP Data Objects)
- **Web Server**: Apache (XAMPP for development)
- **Authentication**: Custom token-based system
- **API Style**: RESTful JSON APIs

#### Database
- **RDBMS**: MySQL 8.0
- **Administration**: phpMyAdmin
- **Features**: Stored procedures, triggers, foreign keys, indexes

### 2.3 Project Structure

The project is organized into clear separation of concerns:

- **frontend/**: React application with src/, public/, and configuration files
- **backend/**: PHP APIs organized by feature (auth, tasks, rewards, etc.)
- **admin/**: Admin panel with legacy PHP and database migrations
- **uploads/**: User-uploaded content storage


### 2.4 Communication Flow

The system follows a standard client-server request-response pattern:

1. **User Request**: Browser ? Frontend React App
2. **API Call**: Frontend ? Backend PHP APIs (via Axios with Bearer token)
3. **Authentication**: Middleware validates session token
4. **Database Query**: Backend ? MySQL (via PDO prepared statements)
5. **Response**: MySQL ? Backend ? Frontend ? User

### 2.5 Data Flow Example: Task Submission

When a user completes a task (e.g., quiz):
1. Frontend validates user inputs
2. POST request to `/backend/api/tasks/submit-quiz.php`
3. Auth middleware validates Bearer token from session
4. Backend calculates score and validates answers against database
5. Store submission in `user_task_submissions` table
6. Call stored procedure `update_user_progress` to update completion percentage
7. RewardHelper awards XP, EP, badges, and titles based on completion
8. Response includes score, rewards earned, and next task
9. Frontend displays success message and reward notifications

---

## 3. Frontend Implementation

### 3.1 React Architecture

The frontend uses modern React patterns with functional components and hooks:

**Component Hierarchy**:
- **Pages**: Route-level components (HomePage, AttractionsPage, RewardsPage)
- **Layout**: Structural components (Header, Footer, Sidebar, Layout wrapper)
- **Features**: Domain-specific (AttractionCard, TaskCard, RewardBadge, CategoryMilestone)
- **UI**: Reusable primitives (Button, Card, Input, Modal, Loading, ProgressBar)
- **Tasks**: Task-specific interfaces (QuizTask, CheckinTask, DirectionTask, ObservationMatchTask, CountConfirmTask, TimeBasedTask)

**React Patterns Used**:
- Functional components with hooks (useState, useEffect, useCallback)
- Custom hooks (useTierUnlockDetection for reward animations)
- Protected route HOC pattern for authentication
- Component composition over inheritance
- Prop drilling minimized via Zustand stores

### 3.2 State Management (Zustand)

Zustand provides lightweight global state without Redux complexity:

**authStore**: Authentication state
- user object (id, username, email, profile_picture, avatar_style, avatar_seed)
- token (JWT Bearer token)
- isAuthenticated, isGuest flags
- setAuth(), logout(), updateUser() actions
- Persisted to localStorage

**attractionStore**: Attractions data
- attractions array
- selectedAttraction object
- loading state
- fetchAttractions(), setSelectedAttraction() actions

**progressStore**: User progress tracking
- progressByAttraction map
- completedTasks set
- fetchProgress(), updateProgress() actions

**rewardStore**: Gamification data
- rewards array (badges, titles)
- stats object (XP, EP, level)
- pendingNotifications queue
- addRewardNotification(), clearNotifications() actions

**sidebarStore**: UI state
- isOpen boolean
- toggleSidebar(), closeSidebar() actions

### 3.3 Routing Structure

React Router v6 with protected and public routes:

**Public Routes**:
- `/` - HomePage (landing page with hero, featured attractions, map)
- `/login` - ModernLoginPage (phone/email/Google login)
- `/register` - ModernRegisterPage (registration with avatar onboarding)
- `/attractions/:id` - AttractionDetailPage (public view of attraction details)

**Protected Routes** (require authentication):
- `/dashboard` - DashboardHomePage (user stats, progress overview)
- `/dashboard/attractions` - AttractionsPage (all attractions with categories)
- `/dashboard/attractions/:id` - AttractionDetailPage (full access with tasks)
- `/dashboard/tasks/checkin/:taskId` - CheckinTaskPage (QR check-in)
- `/dashboard/tasks/:taskId/quiz` - QuizTaskPage (multiple choice quiz)
- `/dashboard/tasks/:taskId/direction` - DirectionTaskPage (compass navigation)
- `/dashboard/tasks/:taskId/observation-match` - ObservationMatchTaskPage (match items)
- `/dashboard/tasks/:taskId/count-confirm` - CountConfirmTaskPage (count objects)
- `/dashboard/tasks/:taskId/time-based` - TimeBasedTaskPage (time-limited tasks)
- `/dashboard/progress` - ProgressPage (attraction completion tracking)
- `/dashboard/rewards` - RewardsPage (badges, titles, XP/EP, leaderboard)
- `/dashboard/profile` - ProfilePage (user settings, avatar)
- `/dashboard/reports` - ReportsPage (submit feedback/issues)

**ProtectedRoute Component**: Wraps authenticated routes, redirects to login if not authenticated

### 3.4 API Integration Layer

Centralized Axios-based API client:

**Configuration** (`frontend/src/api/index.js`):
- Base URL: Points to backend PHP server
- Request interceptor: Adds `Authorization: Bearer <token>` header
- Response interceptor: Handles 401 (logout), 500 (error toast)
- Timeout: 30 seconds

**API Modules**:
- **authAPI** (auth.js): login, register, logout, verifySession, changePassword, resetPassword
- **attractionsAPI** (attractions.js): getAll, getById, getTasks, getPublic
- **tasksAPI** (tasks.js): getById, getQuiz, submitQuiz, submitCheckin, submitDirection, etc.
- **rewardsAPI** (rewards.js): getUserRewards, getBadges, getTitles, getStats, getLeaderboard
- **progressAPI** (progress.js): getUserProgress, getAttractionProgress
- **qrAPI** (qr.js): generateQR, verifyQR
- **reportsAPI** (reports.js): submitReport, getUserReports
- **usersAPI** (users.js): updateProfile, setAvatar

### 3.5 Responsive Design Implementation

**Mobile-First Approach**:
- Base styles target 375px (iPhone SE)
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
- Tailwind CSS utility classes for responsive modifiers (sm:, md:, lg:)

**Layout Strategies**:
- Flexbox for one-dimensional layouts (header, navigation)
- CSS Grid for two-dimensional layouts (attraction cards, reward badges)
- Sticky positioning for headers and navigation
- Bottom navigation bar for mobile (floating action menu)
- Sidebar for desktop dashboard

**Touch Optimization**:
- Minimum touch target size: 44x44px
- Swipe gestures for carousel components
- Pull-to-refresh on mobile (native browser behavior)

### 3.6 Key UI Components

**Loading Component** (Loading.jsx):
- Three variants: gradient, classic, modified (default: modified)
- Three sizes: sm, md, lg
- Full-screen overlay mode
- Loading messages
- Used across 30+ pages

**Modal System**:
- RewardNotificationModal: Displays earned rewards with animations
- TierUnlockModal: Celebrates category tier achievements
- QRScannerModal: Camera-based QR code scanning
- Generic Modal: Reusable confirmation/info dialogs

**Progress Indicators**:
- XPBar: Animated progress bar for XP to next level
- ProgressBar: Generic percentage bar
- CategoryProgressCard: Shows category completion with bronze/silver/gold tiers
- CategoryMilestone: Visual milestone achievements

**Map Component** (AttractionMap.jsx):
- Mapbox GL JS integration
- Custom markers for attractions
- Popup windows with attraction details
- User location tracking
- Navigation to attraction
- Clustering for multiple nearby attractions

### 3.7 User Experience Flows

**First-Time User Journey**:
1. Land on HomePage ? Hero section + featured attractions
2. Click "View Attractions" ? Browse attraction cards
3. Select attraction ? View details (public access)
4. Click "Start Tasks" ? Prompted to register/login
5. Complete registration ? Avatar onboarding (DiceBear avatars)
6. Redirected to Dashboard ? See progress overview
7. Select attraction ? First task must be check-in (QR scan)
8. Complete check-in ? Unlock other tasks
9. Complete quiz/direction/observation tasks
10. Earn XP, EP, badges, and titles
11. Check progress ? See completion percentage
12. View rewards ? Badge collection and leaderboard

**Returning User Journey**:
1. Login ? Dashboard with "Welcome back" + recent activity
2. See incomplete attractions with progress bars
3. Continue from last task
4. Check new rewards earned
5. View leaderboard rank
6. Explore new attractions


---

## 4. Backend Implementation

### 4.1 PHP Backend Architecture

The backend is structured as a RESTful API using pure PHP (no framework):

**Core Principles**:
- RESTful resource-based URLs
- JSON request/response format
- Stateless authentication (token-based)
- Separation of concerns (API, config, middleware, utils)
- Database abstraction via PDO

### 4.2 Directory Structure

```
backend/
+-- api/                    # API endpoints
¦   +-- auth/              # Authentication APIs
¦   ¦   +-- login.php
¦   ¦   +-- register.php
¦   ¦   +-- logout.php
¦   ¦   +-- verify-session.php
¦   ¦   +-- change-password.php
¦   ¦   +-- reset-password.php
¦   ¦   +-- google-auth.php
¦   ¦   +-- complete-registration.php
¦   +-- attractions/       # Attraction APIs
¦   ¦   +-- get-all.php
¦   ¦   +-- get-by-id.php
¦   ¦   +-- get-public.php
¦   ¦   +-- get-tasks.php
¦   ¦   +-- get-public-tasks.php
¦   +-- tasks/            # Task submission APIs
¦   ¦   +-- get-by-id.php
¦   ¦   +-- get-quiz.php
¦   ¦   +-- submit-quiz.php
¦   ¦   +-- submit-checkin.php
¦   ¦   +-- submit-direction.php
¦   ¦   +-- submit-observation-match.php
¦   ¦   +-- submit-count-confirm.php
¦   ¦   +-- submit-time-based.php
¦   ¦   +-- check-prerequisite.php
¦   +-- rewards/          # Reward system APIs
¦   ¦   +-- get-user-rewards.php
¦   ¦   +-- get-user-stats.php
¦   ¦   +-- get-badges.php
¦   ¦   +-- get-titles.php
¦   ¦   +-- get-leaderboard.php
¦   ¦   +-- set-active-title.php
¦   ¦   +-- equip-cosmetic.php
¦   +-- progress/         # Progress tracking APIs
¦   ¦   +-- get-user-progress.php
¦   ¦   +-- get-attraction-progress.php
¦   +-- qr/              # QR code APIs
¦   ¦   +-- generate.php
¦   ¦   +-- verify-qr.php
¦   +-- reports/         # User feedback APIs
¦   ¦   +-- submit-report.php
¦   ¦   +-- get-user-reports.php
¦   +-- users/           # User profile APIs
¦   ¦   +-- update-profile.php
¦   ¦   +-- set-avatar.php
¦   +-- guides/          # Educational content APIs
¦   ¦   +-- get-by-attraction.php
¦   ¦   +-- get-by-task.php
¦   +-- images/          # Image proxy API
¦       +-- get.php
+-- config/              # Configuration
¦   +-- database.php     # Database connection class
¦   +-- cors.php         # CORS headers
¦   +-- constants.php    # App constants
+-- middleware/          # Middleware
¦   +-- auth-middleware.php  # Token validation
+-- utils/              # Utilities
    +-- response.php     # JSON response helper
    +-- security.php     # Security functions
    +-- reward-helper.php  # Reward calculation logic
    +-- email.php        # Email sending
    +-- qrcode.php       # QR code generation
    +-- upload.php       # File upload handling
```

### 4.3 Database Connection (PDO)

**Database Class** (`backend/config/database.php`):
```php
class Database {
    private $host = "localhost";
    private $db_name = "ktrek_db";
    private $username = "root";
    private $password = "";
    public $conn;

    public function getConnection() {
        $this->conn = new PDO(
            "mysql:host=" . $this->host . ";dbname=" . $this->db_name,
            $this->username,
            $this->password
        );
        $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        return $this->conn;
    }
}
```

**Benefits of PDO**:
- Prepared statements prevent SQL injection
- Database-agnostic (can switch from MySQL to PostgreSQL)
- Exception-based error handling
- Named parameters for clarity

### 4.4 Authentication System

**Token-Based Authentication** (not traditional PHP sessions):

**Login Flow** (`backend/api/auth/login.php`):
1. Validate username/email and password
2. Query users table for matching credentials
3. Verify password using `password_verify()` against bcrypt hash
4. Generate unique session token (64 characters, base64)
5. Store token in `sessions` table with expiration (7 days)
6. Return token and user object to frontend
7. Frontend stores token in localStorage

**Auth Middleware** (`backend/middleware/auth-middleware.php`):
```php
class AuthMiddleware {
    public function verifySession() {
        // Extract Bearer token from Authorization header
        $headers = getallheaders();
        $token = extract_token_from_header($headers);
        
        // Query sessions table
        $query = "SELECT s.user_id, u.* 
                  FROM sessions s 
                  JOIN users u ON s.user_id = u.id 
                  WHERE s.token = :token 
                  AND s.expires_at > NOW()";
        
        // Return user object if valid, else throw 401
    }
}
```

**All protected endpoints** include:
```php
$auth = new AuthMiddleware($db);
$user = $auth->verifySession(); // Dies with 401 if invalid
$user_id = $user['id'];
```

**Security Features**:
- Passwords hashed with `password_hash()` (bcrypt, cost 12)
- Tokens are cryptographically random
- Token expiration enforced at database level
- No password transmitted after login
- HTTPS enforced in production

### 4.5 API Response Format

**Response Helper** (`backend/utils/response.php`):
```php
class Response {
    public static function success($data, $message, $status = 200) {
        http_response_code($status);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }
    
    public static function error($message, $status = 400) {
        http_response_code($status);
        echo json_encode([
            'success' => false,
            'error' => $message
        ]);
        exit;
    }
}
```

**Consistent JSON Responses**:
- Success: `{ "success": true, "message": "...", "data": {...} }`
- Error: `{ "success": false, "error": "..." }`
- HTTP status codes: 200 (OK), 201 (Created), 400 (Bad Request), 401 (Unauthorized), 404 (Not Found), 500 (Server Error)

### 4.6 Task Submission Logic

**Example: Quiz Submission** (`backend/api/tasks/submit-quiz.php`):

1. **Validate Input**: Ensure task_id and answers are provided
2. **Check Duplicate**: Prevent re-submission of same task
3. **Calculate Score**: 
   - Loop through each answer
   - Query `quiz_options` to check if selected option is correct
   - Calculate percentage: (correct_answers / total_questions) * 100
4. **Store Submission**:
   - Insert into `user_task_submissions` with score and is_correct flag
5. **Update Progress**:
   - Call stored procedure: `CALL update_user_progress(:user_id, :task_id)`
   - This updates `progress` table and recalculates percentage
6. **Award Rewards**:
   - Call `RewardHelper::awardTaskCompletion()`
   - Checks for task_type_completion rewards (e.g., "Complete 5 quizzes")
   - Checks for task_set_completion rewards (e.g., "Complete all tasks at Istana Jahar")
   - Awards badges, titles, and XP based on rarity
7. **Return Response**: Score, rewards, and next task ID

**Transaction Safety**:
```php
try {
    $db->beginTransaction();
    // ... perform operations
    $db->commit();
} catch (PDOException $e) {
    $db->rollBack();
    Response::serverError("Failed to submit quiz");
}
```

### 4.7 Reward Calculation System

**RewardHelper Class** (`backend/utils/reward-helper.php`):

**Purpose**: Centralized reward logic to ensure consistency

**Key Methods**:
- `awardTaskCompletion()`: Awards rewards when user completes a task
- `awardCategoryTierBadge()`: Awards bronze/silver/gold tier badges (via stored procedure)
- `getXPByRarity()`: Returns XP amount based on reward rarity

**Reward Types Awarded**:
1. **Task Type Completion**: Complete N tasks of a specific type (e.g., 5 quizzes)
2. **Task Set Completion**: Complete all tasks in a specific set
3. **Category Tiers**: Bronze (20%), Silver (60%), Gold (100%) of category attractions

**XP by Rarity**:
- Common: 50 XP
- Rare: 100 XP
- Epic: 200 XP
- Legendary: 500 XP

**Award Flow**:
1. Check if reward already earned (prevent duplicates)
2. Check if trigger condition met (count tasks, check completion)
3. Insert into `user_rewards` table
4. Call stored procedure `award_xp()` to update `user_stats`
5. Return awarded rewards to frontend

### 4.8 CORS Configuration

**CORS Headers** (`backend/config/cors.php`):
```php
header("Access-Control-Allow-Origin: *");  // Or specific frontend domain
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Content-Type: application/json; charset=UTF-8");

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}
```

**Purpose**: Allow frontend (different port/domain) to call backend APIs

### 4.9 Error Handling and Logging

**Error Logging**:
```php
error_reporting(E_ALL);
ini_set('display_errors', 0);  // Don't show errors to users
ini_set('log_errors', 1);
error_log("Error message: " . $e->getMessage());
```

**Exception Handling**:
- PDOException for database errors
- Try-catch blocks around critical operations
- Transactions rolled back on errors
- User-friendly error messages returned


---

## 5. Database Design and Schema

### 5.1 Database Overview

**Database Name**: `ktrek_db`  
**RDBMS**: MySQL 8.0  
**Schema Design**: Normalized relational design (3NF)  
**Total Tables**: 20+ tables (core + reward system extensions)

### 5.2 Core Tables

#### users (User Accounts)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
username VARCHAR(50) UNIQUE NOT NULL
email VARCHAR(255) UNIQUE
phone_number VARCHAR(20) UNIQUE
password VARCHAR(255) NOT NULL  -- bcrypt hash
full_name VARCHAR(255) NOT NULL
date_of_birth DATE
profile_picture VARCHAR(500)
avatar_style VARCHAR(50)        -- DiceBear style
avatar_seed VARCHAR(255)        -- DiceBear seed
auth_provider ENUM('email', 'phone', 'google')
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Key Features**:
- Support for email, phone, or Google authentication
- Avatar system using DiceBear (customizable SVG avatars)
- Soft delete via is_active flag
- Timestamps for audit trail

#### sessions (Authentication Tokens)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL FOREIGN KEY -> users(id)
token VARCHAR(255) UNIQUE NOT NULL
expires_at DATETIME NOT NULL
created_at TIMESTAMP
INDEX idx_token (token)
INDEX idx_user_id (user_id)
```

**Purpose**: Store JWT-like tokens for stateless authentication  
**Expiration**: 7 days (configurable)  
**Cleanup**: Expired tokens should be purged periodically

#### attractions (Tourist Attractions)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
name VARCHAR(255) NOT NULL
location VARCHAR(255) NOT NULL
description TEXT NOT NULL
image VARCHAR(500)
latitude DECIMAL(10,8)
longitude DECIMAL(11,8)
navigation_link VARCHAR(1000)    -- Google Maps URL
category VARCHAR(100)             -- Historical, Religious, Nature, Cultural
created_by_admin_id INT
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Categories**:
- Historical: Museums, palaces, heritage sites
- Religious: Mosques, temples, religious buildings
- Nature: Beaches, parks, natural landmarks
- Cultural: Traditional villages, craft centers, cultural centers

#### tasks (Attraction Tasks)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
attraction_id INT NOT NULL FOREIGN KEY -> attractions(id)
name VARCHAR(255) NOT NULL
type ENUM('quiz', 'checkin', 'observation_match', 'count_confirm', 
          'direction', 'time_based', 'memory_recall', 
          'route_completion', 'riddle', 'photo')
task_order INT DEFAULT 0         -- Check-in must be first (order=1)
task_config JSON                 -- Task-specific configuration
description TEXT NOT NULL
qr_code VARCHAR(255)            -- For check-in tasks
media_url VARCHAR(500)          -- Image/video for task
created_at TIMESTAMP
updated_at TIMESTAMP
INDEX idx_qr_code (qr_code)
```

**Task Order System**:
- Check-in tasks: order = 1 (must be completed first)
- Other tasks: order = 10+ (unlocked after check-in)

**Task Config JSON Examples**:
- Time-based: `{"time_window": {"start": "09:00", "end": "17:00"}}`
- Count-confirm: `{"correct_count": 7, "item_name": "pillars"}`
- Direction: `{"target_direction": "North", "tolerance": 15}`

#### quiz_questions (Quiz Content)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
task_id INT NOT NULL FOREIGN KEY -> tasks(id)
question_text TEXT NOT NULL
question_order INT DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
INDEX idx_task_id (task_id)
```

#### quiz_options (Quiz Answer Choices)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
question_id INT NOT NULL FOREIGN KEY -> quiz_questions(id)
option_text TEXT NOT NULL
is_correct BOOLEAN DEFAULT FALSE
option_order INT DEFAULT 0
option_metadata JSON            -- For observation_match tasks
created_at TIMESTAMP
INDEX idx_question_id (question_id)
```

**option_metadata for observation_match**:
```json
{
  "match_pair_id": 1,
  "item_type": "item"  // or "function"
}
```

#### user_task_submissions (Task Completion Records)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL
task_id INT NOT NULL FOREIGN KEY -> tasks(id)
answer TEXT                     -- JSON encoded answers
photo_url VARCHAR(500)         -- For photo tasks
score INT DEFAULT 0            -- Quiz score (0-100)
is_correct BOOLEAN DEFAULT FALSE
latitude DECIMAL(10,8)         -- Location validation
longitude DECIMAL(11,8)
submitted_at TIMESTAMP
INDEX idx_user (user_id)
```

**Purpose**: Immutable record of all task attempts  
**Constraints**: One submission per user per task (enforced in PHP)

#### progress (User Progress Tracking)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL
attraction_id INT NOT NULL FOREIGN KEY -> attractions(id)
completed_tasks INT DEFAULT 0
total_tasks INT DEFAULT 0
progress_percentage DECIMAL(5,2) DEFAULT 0.00
is_unlocked BOOLEAN DEFAULT FALSE
created_at TIMESTAMP
updated_at TIMESTAMP
UNIQUE KEY unique_user_attraction (user_id, attraction_id)
INDEX idx_user (user_id)
```

**Updated by**: Stored procedure `update_user_progress()`  
**Calculation**: `progress_percentage = (completed_tasks / total_tasks) * 100`

#### rewards (Reward Definitions)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
attraction_id INT FOREIGN KEY -> attractions(id)
title VARCHAR(255) NOT NULL
description TEXT NOT NULL
image VARCHAR(500)
reward_type ENUM('badge', 'title', 'cosmetic', 'photo_card', 'stamp')
reward_identifier VARCHAR(255) UNIQUE  -- e.g., 'badge_quiz_master'
rarity ENUM('common', 'rare', 'epic', 'legendary')
trigger_type ENUM('attraction_completion', 'task_type_completion', 
                  'task_set_completion', 'category_milestone', 'manual')
trigger_condition JSON          -- Conditions for earning reward
is_active BOOLEAN DEFAULT TRUE
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Trigger Condition Examples**:
- Task type completion: `{"task_type": "quiz", "required_count": 5}`
- Task set completion: `{"task_ids": [1, 2, 3, 4]}`
- Category milestone: `{"category": "Historical", "tier": "gold"}`

#### admin (Admin Users)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
email VARCHAR(255) UNIQUE NOT NULL
password VARCHAR(255) NOT NULL
full_name VARCHAR(255)
role ENUM('superadmin', 'manager')
attraction_id INT FOREIGN KEY -> attractions(id)  -- For managers
is_active BOOLEAN DEFAULT TRUE
status ENUM('active', 'deactivated', 'suspended')
last_login TIMESTAMP
created_at TIMESTAMP
```

**Roles**:
- Superadmin: Full system access, user management, all attractions
- Manager: Manages assigned attraction only

#### reports (User Feedback)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL
user_email VARCHAR(255)
attraction_id INT FOREIGN KEY -> attractions(id)
message TEXT NOT NULL
reply TEXT
status VARCHAR(50) DEFAULT 'Pending'
replied_at TIMESTAMP
created_at TIMESTAMP
INDEX idx_user (user_id)
```

### 5.3 Reward System Tables

These tables were added through migrations to implement the advanced reward system:

#### user_rewards (User's Earned Rewards)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL
reward_type ENUM('badge', 'title', 'cosmetic', 'photo_card', 'stamp')
reward_identifier VARCHAR(255)  -- Links to rewards.reward_identifier
reward_name VARCHAR(255)
reward_description TEXT
quantity INT DEFAULT 1
category VARCHAR(100)
source_type VARCHAR(100)        -- How reward was earned
source_id INT                   -- Related attraction/task ID
metadata JSON                   -- Additional data (rarity, image URL)
earned_date DATETIME
INDEX idx_user_id (user_id)
INDEX idx_reward_type (reward_type)
```

**Metadata Example**:
```json
{
  "rarity": "epic",
  "image": "/uploads/badge_culture_explorer.png",
  "xp_awarded": 200
}
```

#### user_stats (User XP/Level Statistics)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT UNIQUE NOT NULL
total_xp INT DEFAULT 0
total_ep INT DEFAULT 0          -- Exploration Points
current_level INT DEFAULT 1
xp_to_next_level INT DEFAULT 100
total_badges INT DEFAULT 0
total_titles INT DEFAULT 0
total_cosmetics INT DEFAULT 0
total_photo_cards INT DEFAULT 0
total_stamps INT DEFAULT 0
created_at TIMESTAMP
updated_at TIMESTAMP
```

**Level Calculation**: Based on total_xp with exponential curve  
**Updated by**: Stored procedure `award_xp()`

#### user_category_progress (Category Completion Tracking)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL
category VARCHAR(100) NOT NULL   -- Historical, Religious, Nature, Cultural
total_attractions INT DEFAULT 0
completed_attractions INT DEFAULT 0
completion_percentage DECIMAL(5,2) DEFAULT 0.00
bronze_unlocked BOOLEAN DEFAULT FALSE    -- 20% completion
silver_unlocked BOOLEAN DEFAULT FALSE    -- 60% completion
gold_unlocked BOOLEAN DEFAULT FALSE      -- 100% completion
category_xp_earned INT DEFAULT 0
first_completion_date DATETIME
last_completion_date DATETIME
UNIQUE KEY unique_user_category (user_id, category)
INDEX idx_user_id (user_id)
```

**Tier Thresholds**:
- Bronze: 20% of category attractions completed
- Silver: 60% of category attractions completed
- Gold: 100% of category attractions completed

#### user_milestones (Achievement Milestones)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL
milestone_type ENUM('category_bronze', 'category_silver', 'category_gold', 
                    'level_up', 'first_attraction', 'grand_master')
milestone_name VARCHAR(255)
category VARCHAR(100)
bonus_xp_awarded INT DEFAULT 0
achievement_date DATETIME
INDEX idx_user_id (user_id)
```

**Examples**:
- "Historical Bronze Explorer" (20% of Historical attractions)
- "Level 5 Achieved"
- "First Attraction Completed"
- "Grand Master" (100% all categories)

#### user_badge_fragments (Badge Fragment System - Optional)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT NOT NULL
category VARCHAR(100) NOT NULL
fragments_collected INT DEFAULT 0
fragments_required INT DEFAULT 10
is_complete BOOLEAN DEFAULT FALSE
completed_date DATETIME
UNIQUE KEY unique_user_category (user_id, category)
```

**Purpose**: Collect fragments to unlock special category badges

#### leaderboard (Ranking System)
```sql
id INT PRIMARY KEY AUTO_INCREMENT
user_id INT UNIQUE NOT NULL
rank INT
is_grand_master BOOLEAN DEFAULT FALSE
grand_master_date DATETIME
INDEX idx_rank (rank)
```

**Ranking**: Based on total_xp, updated periodically or on-demand

### 5.4 Database Relationships

**One-to-Many Relationships**:
- users ? sessions (one user, many sessions)
- users ? user_task_submissions (one user, many submissions)
- users ? progress (one user, many attraction progresses)
- users ? user_rewards (one user, many rewards)
- users ? reports (one user, many reports)
- attractions ? tasks (one attraction, many tasks)
- attractions ? rewards (one attraction, many rewards)
- tasks ? quiz_questions (one task, many questions)
- quiz_questions ? quiz_options (one question, many options)

**Many-to-Many Relationships** (via junction tables):
- users ? attractions (via progress table)
- users ? tasks (via user_task_submissions table)
- users ? rewards (via user_rewards table)

### 5.5 Stored Procedures

#### update_user_progress(user_id, task_id)
**Purpose**: Automatically update progress when task is completed

**Logic**:
1. Get attraction_id from task
2. Count completed tasks for that attraction by user
3. Count total tasks for that attraction
4. Calculate progress_percentage
5. Update or insert into progress table
6. If 100% complete, trigger attraction_completion rewards

#### award_xp(user_id, xp_amount, reason, source_type, source_id)
**Purpose**: Award XP and update level

**Logic**:
1. Add xp_amount to user_stats.total_xp
2. Check if level up threshold reached
3. If level up, increment current_level and set xp_to_next_level
4. Update total_badges, total_titles counters if applicable
5. Insert milestone record if level up

#### award_category_tier_badge(user_id, category, tier)
**Purpose**: Award bronze/silver/gold tier badges for category completion

**Logic**:
1. Check if tier already unlocked in user_category_progress
2. Mark tier as unlocked (bronze_unlocked/silver_unlocked/gold_unlocked)
3. Award corresponding XP bonus
4. Insert milestone record

#### init_user_stats(user_id)
**Purpose**: Initialize user_stats row for new users

**Logic**:
1. Check if user_stats exists for user_id
2. If not, insert default values (level 1, 0 XP, etc.)

### 5.6 Database Triggers

#### After INSERT on user_task_submissions
**Purpose**: Automatically call update_user_progress

**Logic**:
```sql
AFTER INSERT ON user_task_submissions FOR EACH ROW
BEGIN
    CALL update_user_progress(NEW.user_id, NEW.task_id);
END
```

**Note**: Triggers are optional; current implementation calls stored procedure manually from PHP

### 5.7 Indexing Strategy

**Primary Indexes**:
- All foreign keys are indexed for JOIN performance
- Token field in sessions table (for authentication lookups)
- QR code field in tasks table (for QR verification)

**Composite Indexes**:
- (user_id, attraction_id) on progress table (unique constraint)
- (user_id, category) on user_category_progress (unique constraint)
- (question_id, option_order) on quiz_options (for ordered retrieval)

**Performance Considerations**:
- Indexes speed up JOINs and WHERE clauses
- Trade-off: Slower INSERTs due to index maintenance
- Overall: Read-heavy workload benefits from indexes

### 5.8 Data Integrity Constraints

**Foreign Keys with CASCADE**:
- tasks.attraction_id ? attractions.id ON DELETE CASCADE (delete tasks when attraction deleted)
- quiz_questions.task_id ? tasks.id ON DELETE CASCADE
- quiz_options.question_id ? quiz_questions.id ON DELETE CASCADE
- user_task_submissions.task_id ? tasks.id ON DELETE CASCADE

**Foreign Keys with SET NULL**:
- attractions.created_by_admin_id ? admin.id ON DELETE SET NULL
- reports.attraction_id ? attractions.id ON DELETE SET NULL

**UNIQUE Constraints**:
- users.username, users.email, users.phone_number (prevent duplicates)
- sessions.token (prevent token collision)
- rewards.reward_identifier (prevent duplicate reward definitions)
- progress(user_id, attraction_id) (one progress record per user per attraction)

**CHECK Constraints** (enforced at application level):
- progress_percentage between 0 and 100
- score between 0 and 100
- Latitude between -90 and 90
- Longitude between -180 and 180


---

## 6. Authentication and User Management

### 6.1 Authentication Architecture

K-Trek implements a **token-based authentication system** (not traditional PHP sessions):

**Key Characteristics**:
- Stateless authentication (no server-side session files)
- JWT-style Bearer tokens
- Token stored in database (sessions table)
- Frontend stores token in localStorage
- Token sent via Authorization header on every API request

### 6.2 Registration Flow

**User Registration** (`backend/api/auth/register.php`):

1. **Input Validation**:
   - Username: Required, 3-50 characters, alphanumeric
   - Email OR phone_number: At least one required
   - Password: Minimum 8 characters
   - Full name: Required

2. **Duplicate Check**:
   - Query users table for existing username/email/phone
   - Return error if duplicate found

3. **Password Hashing**:
   ```php
   $hashed_password = password_hash($password, PASSWORD_BCRYPT, ['cost' => 12]);
   ```
   - Uses bcrypt algorithm (industry standard)
   - Cost factor 12 (balance between security and performance)
   - Salt automatically generated and stored in hash

4. **User Creation**:
   - Insert into users table with hashed password
   - Set auth_provider based on registration method
   - is_active = TRUE by default

5. **Auto-Login**:
   - Generate session token
   - Insert into sessions table
   - Return token and user object to frontend

6. **Avatar Onboarding**:
   - Frontend redirects to avatar selection page
   - User chooses DiceBear style and seed
   - Call `/backend/api/users/set-avatar.php` to save

### 6.3 Login Flow

**User Login** (`backend/api/auth/login.php`):

1. **Credential Input**:
   - Identifier: username, email, OR phone_number
   - Password: Plain text (transmitted over HTTPS)

2. **User Lookup**:
   ```sql
   SELECT * FROM users 
   WHERE (username = :identifier 
          OR email = :identifier 
          OR phone_number = :identifier)
   AND is_active = TRUE
   ```

3. **Password Verification**:
   ```php
   if (!password_verify($password, $user['password'])) {
       Response::error("Invalid credentials", 401);
   }
   ```

4. **Session Token Generation**:
   ```php
   $token = bin2hex(random_bytes(32)); // 64-character hex string
   $expires_at = date('Y-m-d H:i:s', strtotime('+7 days'));
   ```

5. **Store Session**:
   ```sql
   INSERT INTO sessions (user_id, token, expires_at)
   VALUES (:user_id, :token, :expires_at)
   ```

6. **Response**:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "token": "abc123...",
       "user": {
         "id": 1,
         "username": "tourist123",
         "email": "tourist@example.com",
         "full_name": "Tourist User",
         "avatar_style": "avataaars",
         "avatar_seed": "tourist123"
       }
     }
   }
   ```

7. **Frontend Storage**:
   ```javascript
   localStorage.setItem('token', token);
   localStorage.setItem('user', JSON.stringify(user));
   authStore.setAuth(user, token);
   ```

### 6.4 Authentication Middleware

**Auth Middleware** (`backend/middleware/auth-middleware.php`):

Every protected endpoint includes:
```php
require_once '../../middleware/auth-middleware.php';

$auth = new AuthMiddleware($db);
$user = $auth->verifySession();
// $user contains authenticated user data
```

**Middleware Logic**:
1. **Extract Token**:
   ```php
   $headers = getallheaders();
   $auth_header = $headers['Authorization'] ?? '';
   // Expected format: "Bearer abc123..."
   $token = str_replace('Bearer ', '', $auth_header);
   ```

2. **Validate Token**:
   ```sql
   SELECT s.user_id, u.* 
   FROM sessions s
   JOIN users u ON s.user_id = u.id
   WHERE s.token = :token 
   AND s.expires_at > NOW()
   AND u.is_active = TRUE
   ```

3. **Return User or Error**:
   - If valid: Return user object
   - If invalid/expired: Return 401 Unauthorized
   - Frontend intercepts 401 and redirects to login

### 6.5 Google OAuth Integration

**Google Authentication** (`backend/api/auth/google-auth.php`):

1. **Frontend Flow**:
   - User clicks "Sign in with Google"
   - Google OAuth popup opens
   - User authenticates with Google
   - Google returns ID token (JWT)

2. **Backend Verification**:
   - Frontend sends Google ID token to backend
   - Backend verifies token with Google API
   - Extract email, name from Google profile

3. **User Lookup or Creation**:
   ```sql
   SELECT * FROM users WHERE email = :google_email
   ```
   - If exists: Login user
   - If not exists: Create new user with auth_provider='google'
   - No password needed (Google handles authentication)

4. **Session Token**:
   - Generate session token as usual
   - Return to frontend

### 6.6 Password Reset Flow

**Reset Password** (`backend/api/auth/reset-password.php`):

1. **Request Reset**:
   - User enters email/phone
   - Backend generates verification code (6-digit)
   - Store code in sessions table or separate verification_codes table
   - Send code via email/SMS

2. **Verify Code**:
   - User enters code
   - Backend validates code and expiration

3. **Set New Password**:
   - User enters new password
   - Hash password and update users table
   - Invalidate old sessions (delete from sessions table)

### 6.7 Logout Flow

**Logout** (`backend/api/auth/logout.php`):

1. **Token Extraction**: Get token from Authorization header
2. **Delete Session**:
   ```sql
   DELETE FROM sessions WHERE token = :token
   ```
3. **Frontend Cleanup**:
   ```javascript
   localStorage.removeItem('token');
   localStorage.removeItem('user');
   authStore.logout();
   navigate('/login');
   ```

### 6.8 Session Management

**Session Expiration**:
- Default: 7 days from creation
- Expired sessions automatically rejected by middleware
- Expired sessions should be cleaned up periodically:
  ```sql
  DELETE FROM sessions WHERE expires_at < NOW();
  ```

**Session Renewal** (optional enhancement):
- Extend expires_at on every API call
- Implement "remember me" with longer expiration

**Multiple Sessions**:
- User can be logged in on multiple devices
- Each device has its own session token
- Logout only invalidates current device's token

### 6.9 Security Best Practices Implemented

1. **Password Security**:
   - Bcrypt hashing with cost factor 12
   - Salt automatically generated per password
   - Password never stored in plain text
   - Password never transmitted after login

2. **Token Security**:
   - Cryptographically random tokens (random_bytes)
   - 64-character length (256 bits of entropy)
   - Token transmitted via HTTPS only
   - Token expiration enforced

3. **SQL Injection Prevention**:
   - PDO prepared statements for all queries
   - Named parameters (:user_id, :token)
   - No string concatenation in SQL

4. **XSS Prevention**:
   - JSON responses (not HTML)
   - Frontend sanitizes user-generated content
   - Content-Type: application/json header

5. **CSRF Prevention**:
   - Stateless authentication (no cookies)
   - Token-based system inherently CSRF-resistant

6. **Rate Limiting** (recommended addition):
   - Limit login attempts per IP/username
   - Implement exponential backoff
   - Log failed login attempts

### 6.10 User Profile Management

**Update Profile** (`backend/api/users/update-profile.php`):

**Updatable Fields**:
- full_name
- email (with verification)
- phone_number (with verification)
- date_of_birth
- profile_picture (via upload)

**Validation**:
- Email format validation
- Phone number format validation
- Check for duplicate email/phone

**Set Avatar** (`backend/api/users/set-avatar.php`):

**DiceBear Integration**:
- Frontend generates avatar SVG URL: `https://api.dicebear.com/7.x/{style}/svg?seed={seed}`
- Styles: avataaars, bottts, pixel-art, lorelei, etc.
- User selects style and seed (username by default)
- Store avatar_style and avatar_seed in users table
- Frontend renders avatar on-demand

### 6.11 Admin Authentication

**Separate Admin System** (`admin/api/login.php`):

**Differences from User Auth**:
- Uses traditional PHP sessions (not tokens)
- Separate admin table
- Role-based access (superadmin vs manager)
- Session stored in server-side session files

**Admin Login**:
1. Email + password authentication
2. Verify against admin table
3. Start PHP session: `session_start()`
4. Store admin data in `$_SESSION['admin']`
5. Check session on every admin page

**Admin Roles**:
- **Superadmin**: Full access to all features, user management, all attractions
- **Manager**: Access to assigned attraction only, limited features

---

## 7. Gamification and Rewards System

### 7.1 Gamification Overview

K-Trek implements a comprehensive gamification system to engage tourists:

**Core Gamification Elements**:
1. **Experience Points (XP)**: Measures overall achievement
2. **Exploration Points (EP)**: Measures breadth of exploration
3. **Levels**: Progression system based on XP
4. **Badges**: Achievement icons for completing challenges
5. **Titles**: Display names earned through achievements
6. **Category Tiers**: Bronze/Silver/Gold progression per category
7. **Leaderboard**: Competitive ranking system

### 7.2 XP and EP System

**XP (Experience Points)**:
- **Purpose**: Measures user's overall achievement and knowledge
- **Earned From**:
  - Completing tasks (base XP per task type)
  - Earning badges (rarity-based XP: common 50, rare 100, epic 200, legendary 500)
  - Earning titles (rarity-based XP)
  - Category tier milestones (bronze/silver/gold bonuses)
  - Level up bonuses
- **Stored In**: user_stats.total_xp
- **Display**: Progress bar showing XP to next level

**EP (Exploration Points)**:
- **Purpose**: Measures breadth of exploration (different attractions visited)
- **Earned From**:
  - Completing first task at an attraction (e.g., 10 EP)
  - Completing 100% of an attraction (e.g., 50 EP)
  - Visiting attractions in different categories (bonus EP)
- **Stored In**: user_stats.total_ep
- **Display**: EP badge on profile

**Level System**:
- **Calculation**: Based on total_xp with exponential curve
- **Level Up Requirements**:
  - Level 1?2: 100 XP
  - Level 2?3: 250 XP
  - Level 3?4: 450 XP
  - Level 4?5: 700 XP
  - Formula: `XP_required = base * (level ^ 1.5)`
- **Benefits**:
  - Unlock special titles at certain levels
  - Prestige and leaderboard ranking
  - Potential future: Unlock exclusive attractions or tasks

### 7.3 Badge System

**Badge Categories**:
1. **Task Type Badges**: Complete N tasks of specific type
   - Example: "Quiz Master" (complete 10 quizzes)
   - Example: "Explorer" (complete 5 check-ins)
   
2. **Task Set Badges**: Complete all tasks at specific attractions
   - Example: "Istana Jahar Expert" (all tasks at Istana Jahar)
   
3. **Category Tier Badges**: Complete percentage of category attractions
   - Example: "Historical Bronze Explorer" (20% of Historical attractions)
   - Example: "Religious Silver Scholar" (60% of Religious attractions)
   - Example: "Nature Gold Master" (100% of Nature attractions)
   
4. **Special Badges**: Unique achievements
   - Example: "First Steps" (first attraction completed)
   - Example: "Grand Master" (100% of all categories)

**Badge Rarity Tiers**:
- **Common** (gray): Easy achievements (50 XP)
- **Rare** (blue): Moderate achievements (100 XP)
- **Epic** (purple): Challenging achievements (200 XP)
- **Legendary** (gold): Exceptional achievements (500 XP)

**Badge Metadata**:
```json
{
  "rarity": "epic",
  "image": "/uploads/badge_quiz_master.png",
  "xp_awarded": 200,
  "earned_date": "2026-01-26T10:30:00Z"
}
```

### 7.4 Title System

**Titles**: Display names shown on user profile and leaderboard

**Title Examples**:
- "Novice Explorer" (level 1-5)
- "Seasoned Traveler" (level 6-10)
- "Cultural Expert" (complete 50% of all attractions)
- "Kelantan Ambassador" (complete 100% of all attractions)
- "Quiz Champion" (perfect score on 20 quizzes)

**Active Title**:
- User can equip one title at a time
- Set via `/backend/api/rewards/set-active-title.php`
- Displayed prominently on profile and leaderboard

### 7.5 Category Milestone System

**Purpose**: Encourage users to explore all categories (not just favorites)

**Categories**:
- Historical
- Religious
- Nature
- Cultural

**Tier System** (per category):

**Bronze Tier** (20% completion):
- Unlocked when user completes 20% of attractions in category
- Award bronze badge for category
- Bonus: 100 XP
- Example: "Historical Bronze Explorer"

**Silver Tier** (60% completion):
- Unlocked when user completes 60% of attractions in category
- Award silver badge for category
- Bonus: 250 XP
- Example: "Historical Silver Scholar"

**Gold Tier** (100% completion):
- Unlocked when user completes 100% of attractions in category
- Award gold badge for category
- Bonus: 500 XP
- Example: "Historical Gold Master"

**Stored In**: user_category_progress table
```sql
user_id | category    | total_attractions | completed_attractions | 
        | completion_percentage | bronze_unlocked | silver_unlocked | gold_unlocked
--------|-------------|-------------------|----------------------|-------------
1       | Historical  | 10                | 7                    | 70.00       
        | TRUE        | TRUE              | FALSE
```

**UI Display**: CategoryProgressCard component shows progress with tier badges

### 7.6 Reward Trigger System

**Trigger Types**:

1. **attraction_completion**:
   - Triggered when user completes 100% of an attraction
   - Awards attraction-specific badge
   
2. **task_type_completion**:
   - Triggered when user completes N tasks of specific type
   - Example: Complete 5 quizzes ? "Quiz Enthusiast" badge
   - Condition: `{"task_type": "quiz", "required_count": 5}`
   
3. **task_set_completion**:
   - Triggered when user completes all tasks in a predefined set
   - Example: All tasks at 3 specific historical sites ? "Historical Explorer" badge
   - Condition: `{"task_ids": [1, 2, 3, 4, 5, 6]}`
   
4. **category_milestone**:
   - Triggered when user reaches bronze/silver/gold tier in a category
   - Handled by stored procedure `award_category_tier_badge()`
   
5. **manual**:
   - Admin manually awards reward to user
   - For special events, promotions, or corrections

**Trigger Condition JSON**:
Stored in rewards.trigger_condition column
```json
{
  "task_type": "quiz",
  "required_count": 10,
  "category": "Historical"  // Optional filter
}
```

### 7.7 Reward Award Logic

**RewardHelper::awardTaskCompletion()** flow:

1. **Check Eligibility**:
   - Query rewards table for active rewards with matching trigger_type
   - Filter by trigger conditions (task_type, category, etc.)

2. **Check Duplicate**:
   - Query user_rewards to see if user already has this reward
   - Skip if already awarded (prevent duplicates)

3. **Check Completion**:
   - For task_type_completion: Count user's completed tasks of that type
   - For task_set_completion: Check if all tasks in set are completed
   - Compare against required_count or task_ids

4. **Award Reward**:
   ```sql
   INSERT INTO user_rewards (user_id, reward_type, reward_identifier, 
                             reward_name, reward_description, category, 
                             metadata, earned_date)
   VALUES (...);
   ```

5. **Award XP**:
   ```sql
   CALL award_xp(:user_id, :xp_amount, :reason, :source_type, :source_id);
   ```
   - XP amount determined by rarity (common=50, rare=100, epic=200, legendary=500)

6. **Update Stats**:
   - Increment user_stats.total_badges or total_titles
   - Check for level up

7. **Return Awarded Rewards**:
   - Return array of rewards to include in API response
   - Frontend displays reward notification modal

### 7.8 Stored Procedure: award_xp()

**Purpose**: Centralized XP awarding with automatic level-up

**Parameters**:
- user_id INT
- xp_amount INT
- reason VARCHAR(255) - Description of why XP was awarded
- source_type VARCHAR(100) - 'task_completion', 'badge_earned', 'milestone', etc.
- source_id INT - Related task_id or reward_id

**Logic**:
1. **Add XP**:
   ```sql
   UPDATE user_stats 
   SET total_xp = total_xp + xp_amount
   WHERE user_id = user_id;
   ```

2. **Check Level Up**:
   ```sql
   WHILE (total_xp >= xp_to_next_level) DO
     SET current_level = current_level + 1;
     SET xp_to_next_level = calculate_next_level_xp(current_level);
     
     -- Insert milestone
     INSERT INTO user_milestones (user_id, milestone_type, milestone_name)
     VALUES (user_id, 'level_up', CONCAT('Level ', current_level, ' Achieved'));
   END WHILE;
   ```

3. **Update Stats**:
   ```sql
   UPDATE user_stats SET updated_at = NOW() WHERE user_id = user_id;
   ```

### 7.9 Leaderboard System

**Ranking Calculation**:
- Primary: total_xp (descending)
- Secondary: total_ep (tiebreaker)
- Tertiary: user registration date (earlier = higher)

**Leaderboard Query**:
```sql
SELECT 
  u.id, u.username, u.full_name, u.avatar_style, u.avatar_seed,
  us.total_xp, us.total_ep, us.current_level,
  us.total_badges, us.total_titles,
  l.rank, l.is_grand_master
FROM users u
JOIN user_stats us ON u.id = us.user_id
LEFT JOIN leaderboard l ON u.id = l.user_id
WHERE u.is_active = TRUE
ORDER BY us.total_xp DESC, us.total_ep DESC, u.created_at ASC
LIMIT 100;
```

**Grand Master Status**:
- Awarded when user completes 100% of all attractions in all categories
- is_grand_master flag set in leaderboard table
- Special badge and title awarded
- Displayed with gold crown icon on leaderboard

**API Endpoint**: `/backend/api/rewards/get-leaderboard.php`

**Leaderboard UI**:
- Top 10 prominently displayed
- User's own rank highlighted
- Pagination for viewing more ranks
- Real-time updates on user achievement

### 7.10 Reward Notification System

**Frontend Implementation**:

**useTierUnlockDetection Hook**:
- Listens for category tier changes
- Compares previous and current tier status
- Triggers TierUnlockModal when tier unlocked

**RewardNotificationModal**:
- Displays newly earned badges/titles
- Shows XP gained
- Animated appearance
- Queue system for multiple rewards

**Notification Queue**:
```javascript
rewardStore.addRewardNotification({
  reward_type: 'badge',
  reward_name: 'Quiz Master',
  rarity: 'epic',
  xp_awarded: 200,
  image_url: '/uploads/badge_quiz_master.png'
});
```

**Display Timing**:
- After task submission API response
- After progress page load (check for new rewards)
- On rewards page (view earned rewards)


---

## 8. Task Types and Implementation

### 8.1 Task System Overview

K-Trek features **7 interactive task types** that users complete at attractions:

1. **Check-in** (QR Code Scanning)
2. **Quiz** (Multiple Choice Questions)
3. **Direction** (Compass Navigation)
4. **Observation Match** (Match Items to Functions)
5. **Count Confirm** (Count Physical Objects)
6. **Time-Based** (Time-Window Restricted Tasks)
7. **Photo** (Upload Photo Evidence) - *Partially implemented*

**Task Order System**:
- **Check-in tasks**: Always first (task_order = 1)
- **Other tasks**: Unlocked after check-in (task_order = 10+)
- **Enforced at**: Frontend UI and backend prerequisite checks

### 8.2 Check-in Task (QR Code)

**Purpose**: Verify user is physically present at the attraction

**Implementation**:

**QR Code Generation** (`backend/api/qr/generate.php`):
1. Admin generates unique QR code for attraction/task
2. QR code contains encrypted payload: `{"task_id": 123, "attraction_id": 5, "timestamp": 1706259600}`
3. QR code image stored in uploads/ or generated on-demand
4. QR code displayed on physical signage at attraction

**QR Scanning Flow**:
1. User opens CheckinTaskPage
2. Click "Scan QR Code" button
3. QRScannerModal opens (uses device camera)
4. Html5-QRCode library scans QR code
5. Extract task_id from QR payload
6. Submit to `/backend/api/tasks/submit-checkin.php`

**Backend Validation** (`submit-checkin.php`):
```php
// 1. Verify QR code authenticity
$qr_data = json_decode($scanned_qr_code, true);
$task_id = $qr_data['task_id'];

// 2. Check if QR matches task
$query = "SELECT * FROM tasks WHERE id = :task_id AND qr_code = :qr_code";

// 3. Optional: Validate location (if GPS coordinates provided)
if (isset($latitude) && isset($longitude)) {
    $distance = calculate_distance($latitude, $longitude, 
                                   $attraction_lat, $attraction_lng);
    if ($distance > 100) { // More than 100 meters away
        Response::error("You must be at the attraction to check in");
    }
}

// 4. Store submission
$query = "INSERT INTO user_task_submissions 
          (user_id, task_id, is_correct, latitude, longitude, submitted_at)
          VALUES (:user_id, :task_id, TRUE, :lat, :lng, NOW())";

// 5. Award rewards
RewardHelper::awardTaskCompletion($user_id, $task_id, 'checkin');

// 6. Return success + rewards
Response::success(['next_task' => get_next_task($task_id)], 
                  "Check-in successful!");
```

**Security Considerations**:
- QR codes are task-specific (cannot reuse for different task)
- Optional timestamp expiration (QR valid for X hours)
- Optional GPS validation (within radius)
- One check-in per user per task (enforced)

**Frontend Component**: `CheckinTaskPage.jsx`, `QRScannerModal.jsx`

### 8.3 Quiz Task (Multiple Choice)

**Purpose**: Test user's knowledge about the attraction

**Data Structure**:
```
tasks (type='quiz')
  +-- quiz_questions (multiple questions per task)
  ¦     +-- quiz_options (4 options per question)
  ¦     ¦     +-- option A (is_correct = FALSE)
  ¦     ¦     +-- option B (is_correct = TRUE)
  ¦     ¦     +-- option C (is_correct = FALSE)
  ¦     ¦     +-- option D (is_correct = FALSE)
```

**Quiz Flow**:

1. **Load Quiz** (`/backend/api/tasks/get-quiz.php`):
```sql
SELECT 
  q.id as question_id, q.question_text, q.question_order,
  o.id as option_id, o.option_text, o.option_order
FROM quiz_questions q
JOIN quiz_options o ON q.id = o.question_id
WHERE q.task_id = :task_id
ORDER BY q.question_order, o.option_order
```

2. **User Answers**:
   - Frontend displays questions one-by-one or all at once
   - User selects one option per question
   - Submit button sends all answers

3. **Submit Quiz** (`/backend/api/tasks/submit-quiz.php`):
```php
// Answer format: {"question_1": "option_2", "question_3": "option_7"}
$answers = json_decode($request_body['answers'], true);

$correct_count = 0;
$total_questions = count($answers);

foreach ($answers as $question_id => $selected_option_id) {
    // Check if selected option is correct
    $query = "SELECT is_correct FROM quiz_options 
              WHERE id = :option_id AND question_id = :question_id";
    $stmt = $db->prepare($query);
    $stmt->execute([':option_id' => $selected_option_id, 
                    ':question_id' => $question_id]);
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    
    if ($result && $result['is_correct'] == 1) {
        $correct_count++;
    }
}

$score = ($correct_count / $total_questions) * 100;
$is_correct = ($score >= 60); // Pass threshold: 60%

// Store submission
INSERT INTO user_task_submissions 
(user_id, task_id, answer, score, is_correct, submitted_at)
VALUES (:user_id, :task_id, :answers_json, :score, :is_correct, NOW());

// Award rewards if passed
if ($is_correct) {
    RewardHelper::awardTaskCompletion($user_id, $task_id, 'quiz');
}

// Return score and correct answers
Response::success([
    'score' => $score,
    'correct_count' => $correct_count,
    'total_questions' => $total_questions,
    'passed' => $is_correct,
    'correct_answers' => get_correct_answers($task_id)
], "Quiz submitted!");
```

4. **Results Display**:
   - Show score percentage
   - Show correct vs incorrect answers
   - Highlight wrong answers with correct ones
   - Award XP if passed
   - Show next task button

**Pass Criteria**: 60% or higher (configurable per quiz)

**Frontend Component**: `QuizTaskPage.jsx`, `QuizTask.jsx`

**UI Features**:
- Question counter (Question 1 of 5)
- Progress bar
- Option selection with radio buttons
- Visual feedback on submission (correct/incorrect)
- Sound effects for correct/wrong answers

### 8.4 Direction Task (Compass Navigation)

**Purpose**: Guide users to face specific directions to observe features

**Task Configuration** (tasks.task_config JSON):
```json
{
  "target_direction": "North",
  "tolerance": 15,
  "instruction": "Face North to see the main entrance"
}
```

**Implementation**:

**Compass API**:
- Uses Device Orientation API: `window.addEventListener('deviceorientation', handler)`
- Reads compass heading from `event.alpha` (0-360 degrees)
- Requires HTTPS and user permission
- iOS requires `DeviceOrientationEvent.requestPermission()`

**Direction Calculation**:
```javascript
// Normalize heading to 0-360
let heading = event.alpha; // or event.webkitCompassHeading on iOS
if (heading < 0) heading += 360;

// Calculate difference from target
const target = directionToDegrees(target_direction); // "North" -> 0
const difference = Math.abs(heading - target);
const normalized_diff = Math.min(difference, 360 - difference);

// Check if within tolerance
if (normalized_diff <= tolerance) {
  // User is facing correct direction!
  setIsCorrect(true);
}
```

**Direction Mappings**:
- North: 0° (or 360°)
- Northeast: 45°
- East: 90°
- Southeast: 135°
- South: 180°
- Southwest: 225°
- West: 270°
- Northwest: 315°

**Submission** (`/backend/api/tasks/submit-direction.php`):
```php
// Validate direction
$submitted_direction = $request['direction']; // 0-360
$task_config = json_decode($task['task_config'], true);
$target_direction = $task_config['target_direction'];
$tolerance = $task_config['tolerance'] ?? 15;

$target_degrees = direction_to_degrees($target_direction);
$difference = abs($submitted_direction - $target_degrees);
$normalized_diff = min($difference, 360 - $difference);

$is_correct = ($normalized_diff <= $tolerance);

// Store submission
INSERT INTO user_task_submissions 
(user_id, task_id, answer, is_correct, submitted_at)
VALUES (:user_id, :task_id, :submitted_direction, :is_correct, NOW());

// Award if correct
if ($is_correct) {
    RewardHelper::awardTaskCompletion($user_id, $task_id, 'direction');
}
```

**Frontend Component**: `DirectionTaskPage.jsx`, `DirectionTask.jsx`

**UI Features**:
- Animated compass rose
- Real-time heading display
- Target direction indicator
- Visual feedback (green when aligned)
- Haptic feedback on mobile

### 8.5 Observation Match Task

**Purpose**: Match observed items to their descriptions/functions

**Example**: Match architectural features to their purposes
- Pillar ? Structural support
- Window ? Ventilation and light
- Roof ? Weather protection

**Data Structure**:
```
quiz_questions (contains items to match)
  +-- quiz_options (match pairs)
  ¦     +-- Item 1 (option_metadata: {"match_pair_id": 1, "item_type": "item"})
  ¦     +-- Function 1 (option_metadata: {"match_pair_id": 1, "item_type": "function"})
  ¦     +-- Item 2 (option_metadata: {"match_pair_id": 2, "item_type": "item"})
  ¦     +-- Function 2 (option_metadata: {"match_pair_id": 2, "item_type": "function"})
```

**option_metadata JSON**:
```json
{
  "match_pair_id": 1,
  "item_type": "item",
  "image_url": "/uploads/pillar.jpg"
}
```

**Matching Logic**:
1. Display all items and functions shuffled
2. User drags item to function (or selects pairing)
3. Submit all pairs
4. Backend validates: item.match_pair_id == function.match_pair_id
5. Score: (correct_pairs / total_pairs) * 100

**Submission** (`/backend/api/tasks/submit-observation-match.php`):
```php
// Answer format: {"item_1": "function_3", "item_2": "function_1"}
$pairs = json_decode($request['answer'], true);

$correct_count = 0;
$total_pairs = count($pairs);

foreach ($pairs as $item_option_id => $function_option_id) {
    // Get match_pair_id for both options
    $item_meta = get_option_metadata($item_option_id);
    $function_meta = get_option_metadata($function_option_id);
    
    if ($item_meta['match_pair_id'] === $function_meta['match_pair_id']) {
        $correct_count++;
    }
}

$score = ($correct_count / $total_pairs) * 100;
$is_correct = ($score >= 80); // Pass: 80%

// Store and award
```

**Frontend Component**: `ObservationMatchTaskPage.jsx`, `ObservationMatchTask.jsx`

**UI Features**:
- Drag-and-drop interface
- Visual matching lines
- Image support for items
- Immediate feedback on submission
- Show correct matches

### 8.6 Count Confirm Task

**Purpose**: Count physical objects at the attraction

**Example**: "Count the number of pillars in the main hall"

**Task Configuration** (tasks.task_config JSON):
```json
{
  "correct_count": 7,
  "item_name": "pillars",
  "hint": "Look around the main hall",
  "min_count": 1,
  "max_count": 20
}
```

**Implementation**:

**User Interface**:
- Display item name and instruction
- Number input or stepper (+/- buttons)
- Submit button

**Validation** (`/backend/api/tasks/submit-count-confirm.php`):
```php
$submitted_count = intval($request['count']);
$task_config = json_decode($task['task_config'], true);
$correct_count = $task_config['correct_count'];

$is_correct = ($submitted_count === $correct_count);

// Optional: Allow small margin of error
$tolerance = $task_config['tolerance'] ?? 0;
if (abs($submitted_count - $correct_count) <= $tolerance) {
    $is_correct = true;
}

// Store submission
INSERT INTO user_task_submissions 
(user_id, task_id, answer, is_correct, submitted_at)
VALUES (:user_id, :task_id, :submitted_count, :is_correct, NOW());
```

**Frontend Component**: `CountConfirmTaskPage.jsx`, `CountConfirmTask.jsx`

**UI Features**:
- Large number display
- +/- stepper buttons
- Visual feedback (shake animation if wrong)
- Hint button
- Retry allowed (no penalty)

### 8.7 Time-Based Task

**Purpose**: Tasks that can only be completed during specific times

**Use Cases**:
- Visit during prayer times (for mosques)
- Visit during opening hours
- Visit during sunset (for beach attractions)
- Visit during festival times

**Task Configuration** (tasks.task_config JSON):
```json
{
  "time_window": {
    "start": "09:00",
    "end": "17:00"
  },
  "timezone": "Asia/Kuala_Lumpur",
  "days_of_week": [1, 2, 3, 4, 5]  // Monday to Friday
}
```

**Validation** (`/backend/api/tasks/submit-time-based.php`):
```php
$task_config = json_decode($task['task_config'], true);
$time_window = $task_config['time_window'];

// Get current time in attraction's timezone
date_default_timezone_set($task_config['timezone'] ?? 'Asia/Kuala_Lumpur');
$current_time = date('H:i');
$current_day = date('N'); // 1=Monday, 7=Sunday

// Check day of week
if (isset($task_config['days_of_week']) && 
    !in_array($current_day, $task_config['days_of_week'])) {
    Response::error("This task is only available on specific days");
}

// Check time window
if ($current_time < $time_window['start'] || 
    $current_time > $time_window['end']) {
    Response::error("This task is only available between " . 
                   $time_window['start'] . " and " . $time_window['end']);
}

// If within window, mark as correct
$is_correct = true;

// Store submission
INSERT INTO user_task_submissions 
(user_id, task_id, is_correct, submitted_at)
VALUES (:user_id, :task_id, TRUE, NOW());
```

**Frontend Component**: `TimeBasedTaskPage.jsx`, `TimeBasedTask.jsx`

**UI Features**:
- Display current time
- Display time window
- Countdown timer to window start/end
- Auto-enable submit when in window
- Visual indicator (green during valid time)

### 8.8 Photo Task (Partially Implemented)

**Purpose**: Upload photo evidence of completing a challenge

**Examples**:
- Take a selfie with the attraction
- Photograph a specific architectural detail
- Capture a traditional craft being made

**Task Configuration** (tasks.task_config JSON):
```json
{
  "photo_type": "selfie",
  "location": "main_entrance",
  "instruction": "Take a selfie at the main entrance",
  "requires_approval": true
}
```

**Implementation Flow**:
1. User opens camera (or selects from gallery)
2. Take photo
3. Upload to `/backend/utils/upload.php`
4. Store file path in user_task_submissions.photo_url
5. If requires_approval: Status = "pending_review"
6. Admin reviews photo in admin panel
7. Admin approves/rejects
8. If approved: Award rewards

**Security**:
- File type validation (JPEG, PNG only)
- File size limit (5MB)
- Image optimization (resize if too large)
- Store in uploads/ with unique filename
- Optional: EXIF data validation (GPS, timestamp)

**Status**: Partially implemented (upload works, admin review pending)

### 8.9 Task Prerequisite System

**Purpose**: Ensure tasks are completed in order

**Check Prerequisite** (`/backend/api/tasks/check-prerequisite.php`):
```php
// Check if check-in task completed
$checkin_query = "SELECT COUNT(*) as count 
                  FROM user_task_submissions uts
                  JOIN tasks t ON uts.task_id = t.id
                  WHERE uts.user_id = :user_id 
                  AND t.attraction_id = :attraction_id
                  AND t.type = 'checkin'";

if ($checkin_count == 0) {
    Response::error("You must complete the check-in task first");
}

// Check task-specific prerequisites (if any)
if (isset($task_config['prerequisite_task_id'])) {
    $prereq_completed = check_task_completed($user_id, 
                                             $task_config['prerequisite_task_id']);
    if (!$prereq_completed) {
        Response::error("Complete previous task first");
    }
}

Response::success(['can_start' => true], "Prerequisites met");
```

**Enforced At**:
- Frontend: Disable task buttons until prerequisites met
- Backend: Return error if prerequisites not met
- UI: Show lock icon on locked tasks

### 8.10 Task Submission Best Practices

**Idempotency**:
- Check for duplicate submissions before inserting
- Return existing submission if found
- Prevents double rewards

**Transaction Safety**:
- Wrap submissions in database transactions
- Rollback on any error
- Ensures data consistency

**Error Handling**:
- Validate all inputs
- Catch exceptions
- Return user-friendly error messages
- Log errors for debugging

**Reward Awarding**:
- Award rewards immediately after successful submission
- Include rewards in API response
- Queue notifications for frontend display


---

## 9. Location-Based Features

### 9.1 Geolocation Overview

K-Trek uses geolocation technology to enhance the tourist experience:

**Location Uses**:
1. **Attraction Display**: Show attractions on interactive map
2. **User Location**: Show user's current position
3. **Distance Calculation**: Calculate distance to attractions
4. **Navigation**: Provide directions to attractions
5. **Check-in Validation**: Verify user is at attraction (optional)
6. **Task Gating**: Some tasks require physical presence

### 9.2 Mapbox Integration

**Mapbox GL JS v3.11.0**: Interactive map library

**Implementation** (`frontend/src/components/map/AttractionMap.jsx`):

```javascript
import mapboxgl from 'mapbox-gl';

// Initialize map
mapboxgl.accessToken = 'YOUR_MAPBOX_ACCESS_TOKEN';

const map = new mapboxgl.Map({
  container: mapContainerRef.current,
  style: 'mapbox://styles/mapbox/streets-v12',
  center: [102.2501, 6.1256], // Kelantan coordinates
  zoom: 11
});

// Add attractions as markers
attractions.forEach(attraction => {
  const marker = new mapboxgl.Marker({
    color: getCategoryColor(attraction.category)
  })
  .setLngLat([attraction.longitude, attraction.latitude])
  .setPopup(
    new mapboxgl.Popup().setHTML(`
      <h3>${attraction.name}</h3>
      <p>${attraction.category}</p>
      <button onclick="navigateTo(${attraction.id})">View Details</button>
    `)
  )
  .addTo(map);
});

// Add user location marker
navigator.geolocation.getCurrentPosition(position => {
  const userLocation = [position.coords.longitude, position.coords.latitude];
  
  new mapboxgl.Marker({ color: '#3B82F6' }) // Blue marker
    .setLngLat(userLocation)
    .setPopup(new mapboxgl.Popup().setText('You are here'))
    .addTo(map);
    
  // Center map on user
  map.flyTo({ center: userLocation, zoom: 13 });
});
```

**Map Features**:
- Interactive pan and zoom
- Category-colored markers (Historical=red, Religious=green, Nature=blue, Cultural=orange)
- Click marker to view attraction popup
- User location tracking
- Clustering for nearby attractions
- Terrain and satellite view options

**Category Colors**:
```javascript
const getCategoryColor = (category) => {
  const colors = {
    'Historical': '#EF4444',    // Red
    'Religious': '#10B981',     // Green
    'Nature': '#3B82F6',        // Blue
    'Cultural': '#F59E0B'       // Orange
  };
  return colors[category] || '#6B7280'; // Default gray
};
```

### 9.3 Geolocation API

**Get User Location**:
```javascript
navigator.geolocation.getCurrentPosition(
  (position) => {
    const { latitude, longitude, accuracy } = position.coords;
    console.log(`Location: ${latitude}, ${longitude} ±${accuracy}m`);
    // Use location...
  },
  (error) => {
    console.error('Location error:', error.message);
    // Handle error: User denied permission / Location unavailable
  },
  {
    enableHighAccuracy: true,  // Use GPS (more accurate, slower, more battery)
    timeout: 10000,            // 10 seconds timeout
    maximumAge: 30000          // Accept cached location up to 30 seconds old
  }
);
```

**Permission Handling**:
- Request permission on first use
- Handle denial gracefully (show manual search)
- Explain why location is needed (better experience, check-in validation)

### 9.4 Distance Calculation

**Haversine Formula**: Calculate distance between two GPS coordinates

**Backend Implementation** (PHP):
```php
function calculate_distance($lat1, $lon1, $lat2, $lon2) {
    $earth_radius = 6371; // kilometers
    
    $dLat = deg2rad($lat2 - $lat1);
    $dLon = deg2rad($lon2 - $lon1);
    
    $a = sin($dLat/2) * sin($dLat/2) +
         cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
         sin($dLon/2) * sin($dLon/2);
    
    $c = 2 * atan2(sqrt($a), sqrt(1-$a));
    $distance = $earth_radius * $c;
    
    return $distance; // in kilometers
}
```

**Frontend Implementation** (JavaScript):
```javascript
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in km
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  
  return distance;
};
```

**Usage**:
- Display "X km away" on attraction cards
- Sort attractions by proximity
- Validate check-in (must be within 100m)
- Show nearest attractions first

### 9.5 Navigation to Attractions

**Google Maps Integration**:

**Navigation Link** (stored in attractions.navigation_link):
```
https://www.google.com/maps/dir/?api=1&destination=6.1256,102.2501
```

**Generate Navigation URL**:
```php
function generate_navigation_link($latitude, $longitude) {
    return "https://www.google.com/maps/dir/?api=1&destination=" . 
           $latitude . "," . $longitude;
}
```

**Frontend Implementation**:
```javascript
const navigateToAttraction = (attraction) => {
  const navUrl = attraction.navigation_link || 
                 `https://www.google.com/maps/dir/?api=1&destination=${attraction.latitude},${attraction.longitude}`;
  
  window.open(navUrl, '_blank');
};
```

**User Experience**:
1. User clicks "Get Directions" on attraction page
2. Opens Google Maps in new tab/app
3. Google Maps shows route from current location to attraction
4. User follows directions
5. Returns to K-Trek app to complete tasks

### 9.6 Location-Based Check-in Validation

**Optional Feature**: Verify user is at attraction before allowing check-in

**Implementation**:
```php
// In submit-checkin.php
if (isset($latitude) && isset($longitude)) {
    $attraction_query = "SELECT latitude, longitude FROM attractions 
                         WHERE id = :attraction_id";
    $attraction = fetch_attraction($attraction_id);
    
    $distance = calculate_distance(
        $latitude, $longitude,
        $attraction['latitude'], $attraction['longitude']
    );
    
    $max_distance = 0.1; // 100 meters
    
    if ($distance > $max_distance) {
        Response::error(
            "You must be within " . ($max_distance * 1000) . 
            " meters of the attraction to check in. You are " . 
            round($distance * 1000) . " meters away."
        );
    }
}
```

**Considerations**:
- GPS accuracy varies (5-50 meters typical)
- Allow reasonable radius (100m recommended)
- Handle GPS errors gracefully
- Provide manual override for admins
- Consider indoor locations (GPS may not work)

### 9.7 Attraction Search and Filtering

**Search by Location**:
```javascript
const searchNearbyAttractions = async (latitude, longitude, radiusKm) => {
  const attractions = await attractionsAPI.getAll();
  
  return attractions.filter(attraction => {
    const distance = calculateDistance(
      latitude, longitude,
      attraction.latitude, attraction.longitude
    );
    return distance <= radiusKm;
  }).sort((a, b) => {
    const distA = calculateDistance(latitude, longitude, a.latitude, a.longitude);
    const distB = calculateDistance(latitude, longitude, b.latitude, b.longitude);
    return distA - distB; // Closest first
  });
};
```

**Filter by Category**:
```javascript
const filterByCategory = (attractions, category) => {
  return attractions.filter(a => a.category === category);
};
```

**Combined Search**:
- Text search (name, description)
- Category filter
- Distance filter
- Progress filter (incomplete only)

### 9.8 Offline Support (Future Enhancement)

**Potential Implementation**:
- Service Workers for offline caching
- IndexedDB for storing attraction data
- Cache map tiles for offline viewing
- Queue task submissions for later sync
- Progressive Web App (PWA) manifest

---

## 10. Admin Panel and Management System

### 10.1 Admin Panel Overview

**URL**: `/admin/index.html` (or `/admin/index.php`)

**Purpose**: Manage attractions, tasks, users, rewards, and system settings

**Technology**: Legacy PHP with jQuery (separate from React frontend)

**Access Levels**:
1. **Superadmin**: Full system access
2. **Manager**: Manages assigned attraction only

### 10.2 Admin Authentication

**Admin Login** (`admin/api/login.php`):
- Uses traditional PHP sessions (not token-based)
- Credentials stored in `admin` table
- Password hashed with bcrypt

**Session Management**:
```php
session_start();
$_SESSION['admin_id'] = $admin['id'];
$_SESSION['admin_role'] = $admin['role'];
$_SESSION['admin_name'] = $admin['full_name'];
```

**Role-Based Access Control**:
```php
function require_superadmin() {
    if (!isset($_SESSION['admin_role']) || $_SESSION['admin_role'] !== 'superadmin') {
        die('Unauthorized');
    }
}

function require_manager() {
    if (!isset($_SESSION['admin_role']) || 
        !in_array($_SESSION['admin_role'], ['superadmin', 'manager'])) {
        die('Unauthorized');
    }
}
```

### 10.3 Attraction Management

**Features** (`admin/api/attractions.php`):

**Create Attraction**:
- Form fields: Name, location, description, category
- Image upload (stored in /admin/uploads/)
- GPS coordinates (manual entry or map picker)
- Navigation link (auto-generated or custom)
- Created by admin_id (logged)

**Edit Attraction**:
- Update any field
- Replace image
- History tracking (created_at, updated_at)

**Delete Attraction**:
- Cascade delete tasks and rewards
- Soft delete option (is_active = FALSE)
- Confirmation required

**List Attractions**:
- Paginated table view
- Search by name
- Filter by category
- Sort by created date, name, category
- Show task count per attraction

### 10.4 Task Management

**Features** (`admin/api/tasks.php`):

**Create Task**:
- Select attraction
- Choose task type (dropdown)
- Set task order (check-in must be 1)
- Task name and description
- Task-specific configuration (JSON editor)
- Media upload (images/videos)
- QR code generation (for check-in tasks)

**Task Type Configurations**:

**Quiz**:
- Add questions (modal form)
- For each question:
  - Question text
  - 4 options
  - Mark correct option
  - Question order
- Add observation_match metadata if applicable

**Direction**:
- Target direction (dropdown: N, NE, E, SE, S, SW, W, NW)
- Tolerance (degrees, default 15)
- Instruction text

**Count Confirm**:
- Correct count (integer)
- Item name
- Hint text
- Tolerance (optional)

**Time-Based**:
- Time window start (HH:MM)
- Time window end (HH:MM)
- Days of week (checkboxes)
- Timezone selection

**Edit Task**:
- Modify task details
- Reorder tasks (drag-and-drop)
- Update configuration
- Re-generate QR code

**Delete Task**:
- Remove task and associated data (quiz questions, etc.)
- Cascade delete via foreign keys
- Cannot delete if users have submissions (soft delete instead)

### 10.5 User Management

**Features** (`admin/api/admin_users.php`):

**User List**:
- Paginated table
- Search by username, email, phone
- Filter by registration date, activity status
- Sort by XP, EP, level, registration date

**User Details**:
- Profile information
- Statistics (XP, EP, level, badges, titles)
- Completed attractions
- Task submissions
- Rewards earned
- Activity timeline

**User Actions**:
- Deactivate user (is_active = FALSE)
- Reset password
- Manually award rewards
- View progress reports
- Export user data

**User Analytics**:
- Total users
- Active users (last 30 days)
- New registrations (last 7 days)
- User retention rate
- Most engaged users

### 10.6 Reward Management

**Features** (`admin/api/rewards.php`):

**Create Reward**:
- Reward type (badge, title, cosmetic, photo_card)
- Name and description
- Image upload
- Rarity selection (common, rare, epic, legendary)
- Trigger type (dropdown)
- Trigger condition (JSON editor)
- XP award (auto-calculated from rarity or custom)
- Associated attraction (optional)

**Example Trigger Conditions**:

**Task Type Completion**:
```json
{
  "task_type": "quiz",
  "required_count": 10,
  "category": "Historical"
}
```

**Task Set Completion**:
```json
{
  "task_ids": [1, 3, 5, 7, 9],
  "all_required": true
}
```

**Category Milestone**:
```json
{
  "category": "Historical",
  "tier": "gold",
  "completion_percentage": 100
}
```

**Edit Reward**:
- Modify details
- Change trigger conditions
- Deactivate reward (stop awarding)

**Reward Analytics**:
- Most earned rewards
- Rarest rewards
- Average time to earn
- Reward completion rate

### 10.7 Dashboard and Analytics

**Dashboard Stats** (`admin/api/dashboard_stats.php`):

**Overview Cards**:
- Total users (count from users table)
- Total attractions (count from attractions table)
- Total tasks (count from tasks table)
- Total rewards (count from user_rewards table)
- Completed tasks today (count from user_task_submissions)
- New users this week

**Charts and Graphs**:
- User registrations over time (line chart)
- Task completions by type (pie chart)
- Attraction popularity (bar chart: visits per attraction)
- Reward distribution by rarity (pie chart)
- User level distribution (histogram)
- Category completion rates (stacked bar chart)

**Recent Activity**:
- Latest user registrations
- Recent task submissions
- Recent reward earnings
- Recent reports/feedback

### 10.8 Report Management

**Features** (`admin/api/reports.php`):

**View Reports**:
- List all user reports
- Filter by status (Pending, Replied, Resolved)
- Filter by attraction
- Search by user or message content

**Reply to Report**:
- Text editor for reply
- Email notification to user
- Mark as replied
- Update status

**Report Categories** (optional):
- Bug reports
- Content errors
- Feature requests
- Inappropriate content
- Other feedback

### 10.9 Audit Log

**Purpose**: Track all admin actions for security and compliance

**Logged Actions** (`admin/api/audit_log.php`):
- Admin logins
- Attraction create/edit/delete
- Task create/edit/delete
- Reward create/edit/delete
- User actions (deactivate, reset password, manual reward)
- System setting changes

**Log Entry**:
```sql
INSERT INTO audit_log (admin_id, action_type, target_type, target_id, 
                       description, ip_address, timestamp)
VALUES (:admin_id, 'attraction_create', 'attraction', :attraction_id, 
        'Created attraction: Istana Jahar', :ip, NOW());
```

**Audit Log View**:
- Filterable by admin, action type, date range
- Exportable to CSV
- Search by description

### 10.10 System Settings

**Configurable Settings**:
- Site name and description
- Contact email
- Mapbox API key
- Google OAuth credentials
- Email SMTP settings
- QR code generation settings
- XP multipliers
- Level thresholds
- Default avatar style
- Maintenance mode toggle

**Settings Storage**:
- Option 1: `settings` table (key-value pairs)
- Option 2: Configuration file (`admin/config.php`)
- Option 3: Environment variables (`.env` file)

---

## 11. APIs and Third-Party Integrations

### 11.1 Mapbox Integration

**Mapbox GL JS v3.11.0**

**Purpose**: Interactive maps for displaying attractions and user location

**API Key**: Stored in frontend environment variables
```javascript
// frontend/.env
VITE_MAPBOX_ACCESS_TOKEN=pk.eyJ1...
```

**Usage**:
```javascript
import mapboxgl from 'mapbox-gl';
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
```

**Features Used**:
- Map display (streets, satellite, terrain styles)
- Markers (custom colors per category)
- Popups (attraction details)
- Navigation controls (zoom, rotate, pitch)
- Geocoding (optional: address search)
- Directions API (optional: routing)

**Cost**: Free tier (50,000 map loads/month)

### 11.2 Google OAuth

**Google Identity Services**

**Purpose**: Allow users to sign in with Google account

**Setup**:
1. Create project in Google Cloud Console
2. Enable Google+ API
3. Create OAuth 2.0 client ID
4. Add authorized redirect URIs

**Frontend Implementation**:
```javascript
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';

<GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
  <GoogleLogin
    onSuccess={credentialResponse => {
      const token = credentialResponse.credential;
      // Send to backend for verification
      authAPI.googleAuth(token);
    }}
    onError={() => console.error('Login Failed')}
  />
</GoogleOAuthProvider>
```

**Backend Verification** (`backend/api/auth/google-auth.php`):
```php
require_once 'vendor/autoload.php';
$client = new Google_Client(['client_id' => GOOGLE_CLIENT_ID]);
$payload = $client->verifyIdToken($id_token);

if ($payload) {
    $google_id = $payload['sub'];
    $email = $payload['email'];
    $name = $payload['name'];
    $picture = $payload['picture'];
    
    // Find or create user
    // Generate session token
    // Return to frontend
}
```

### 11.3 QR Code Generation

**Library**: PHP QR Code (or similar)

**Purpose**: Generate QR codes for check-in tasks

**Implementation** (`backend/utils/qrcode.php`):
```php
require_once 'phpqrcode/qrlib.php';

function generate_qr_code($task_id, $attraction_id) {
    $payload = json_encode([
        'task_id' => $task_id,
        'attraction_id' => $attraction_id,
        'timestamp' => time()
    ]);
    
    $filename = 'qr_task_' . $task_id . '.png';
    $filepath = '../uploads/qrcodes/' . $filename;
    
    QRcode::png($payload, $filepath, QR_ECLEVEL_L, 10);
    
    return $filename;
}
```

**QR Scanning** (Frontend):
```javascript
import { Html5QrcodeScanner } from 'html5-qrcode';

const scanner = new Html5QrcodeScanner(
  'qr-reader',
  { fps: 10, qrbox: 250 }
);

scanner.render((decodedText) => {
  const payload = JSON.parse(decodedText);
  // Submit check-in with task_id
  tasksAPI.submitCheckin(payload.task_id);
});
```

### 11.4 DiceBear Avatars

**DiceBear Avatars API v7.x**

**Purpose**: Generate unique SVG avatars for users

**API**: `https://api.dicebear.com/7.x/{style}/svg?seed={seed}`

**Styles**:
- avataaars (cartoon faces)
- bottts (robots)
- pixel-art (8-bit style)
- lorelei (female avatars)
- personas (illustrated avatars)

**Implementation**:
```javascript
const getAvatarUrl = (style, seed) => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
};

// Usage
<img src={getAvatarUrl(user.avatar_style, user.avatar_seed)} 
     alt={user.username} />
```

**Storage**: Store style and seed (not image URL) to allow future customization

**Cost**: Free (API is open-source and free to use)

### 11.5 Email Service (Future)

**Potential Services**:
- SendGrid
- Mailgun
- AWS SES
- SMTP server

**Use Cases**:
- Email verification on registration
- Password reset codes
- Report reply notifications
- Achievement congratulations emails
- Weekly progress summary

**Implementation** (`backend/utils/email.php`):
```php
function send_email($to, $subject, $body) {
    $headers = 'From: noreply@ktrek.com' . "\r\n" .
               'Content-Type: text/html; charset=UTF-8';
    
    return mail($to, $subject, $body, $headers);
}
```

### 11.6 Cloud Storage (Future)

**Purpose**: Store user-uploaded images (profile pictures, photo tasks)

**Options**:
- AWS S3
- Cloudinary
- Google Cloud Storage
- Local storage (current implementation)

**Benefits**:
- Scalability
- CDN distribution
- Automatic image optimization
- Backups


---

## 12. Security Implementation

### 12.1 Authentication Security

**Password Security**:
- **Hashing Algorithm**: bcrypt (PASSWORD_BCRYPT)
- **Cost Factor**: 12 (2^12 = 4,096 iterations)
- **Salt**: Automatically generated and included in hash
- **Storage**: Only hash stored in database (never plain text)
- **Verification**: `password_verify()` for constant-time comparison

**Token Security**:
- **Generation**: `bin2hex(random_bytes(32))` - cryptographically secure
- **Length**: 64 characters (256 bits of entropy)
- **Storage**: Database only (not in cookies or URL parameters)
- **Transmission**: HTTPS only via Authorization header
- **Expiration**: 7 days, enforced at database level
- **Scope**: Per-device (each login creates new token)

### 12.2 SQL Injection Prevention

**PDO Prepared Statements**:
```php
// SECURE: Using prepared statements
$query = "SELECT * FROM users WHERE id = :user_id";
$stmt = $db->prepare($query);
$stmt->bindParam(':user_id', $user_id, PDO::PARAM_INT);
$stmt->execute();

// INSECURE: Direct concatenation (NEVER DO THIS)
$query = "SELECT * FROM users WHERE id = " . $user_id;
```

**Benefits**:
- SQL and data are separated
- Parameters are properly escaped
- Type safety with PDO::PARAM_INT, PDO::PARAM_STR
- Protects against injection attacks

### 12.3 Cross-Site Scripting (XSS) Prevention

**Backend**:
- JSON responses only (not HTML rendering)
- Content-Type header set to application/json
- No user input echoed directly to HTML

**Frontend**:
- React automatically escapes JSX content
- Dangerous HTML disabled by default
- User-generated content sanitized before display
- DOMPurify library for rich text (if needed)

**Example**:
```javascript
// SECURE: React automatically escapes
<div>{user.username}</div>

// INSECURE: dangerouslySetInnerHTML (avoid unless necessary)
<div dangerouslySetInnerHTML={{__html: userContent}} />
```

### 12.4 Cross-Site Request Forgery (CSRF) Prevention

**Token-Based Authentication Benefits**:
- No cookies used (stateless authentication)
- Token in Authorization header (not automatically sent by browser)
- CSRF attacks rely on cookie-based sessions (not applicable here)

**Additional Protection**:
- SameSite cookie attribute (if cookies used in admin panel)
- Origin/Referer header validation
- CORS configuration restricts API access

### 12.5 CORS Configuration

**Purpose**: Control which domains can access the API

**Development** (`backend/config/cors.php`):
```php
header("Access-Control-Allow-Origin: *"); // Allow all origins
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
```

**Production** (recommended):
```php
$allowed_origins = [
    'https://ktrek.vercel.app',
    'https://www.ktrek.my'
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
}
```

### 12.6 Input Validation

**Backend Validation**:
```php
// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    Response::error("Invalid email format");
}

// Validate integer
$user_id = filter_var($input_user_id, FILTER_VALIDATE_INT);
if ($user_id === false) {
    Response::error("Invalid user ID");
}

// Sanitize string
$username = htmlspecialchars(trim($input_username), ENT_QUOTES, 'UTF-8');

// Validate length
if (strlen($username) < 3 || strlen($username) > 50) {
    Response::error("Username must be 3-50 characters");
}
```

**Frontend Validation**:
```javascript
// Validate before submitting
const validateEmail = (email) => {
  const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return regex.test(email);
};

const validatePassword = (password) => {
  return password.length >= 8;
};
```

### 12.7 File Upload Security

**Validation** (`backend/utils/upload.php`):
```php
// Check file size (5MB max)
$max_size = 5 * 1024 * 1024;
if ($_FILES['file']['size'] > $max_size) {
    Response::error("File too large. Max 5MB.");
}

// Check file type (whitelist)
$allowed_types = ['image/jpeg', 'image/png', 'image/jpg'];
$file_type = mime_content_type($_FILES['file']['tmp_name']);
if (!in_array($file_type, $allowed_types)) {
    Response::error("Invalid file type. Only JPEG and PNG allowed.");
}

// Generate unique filename (prevent overwrite)
$extension = pathinfo($_FILES['file']['name'], PATHINFO_EXTENSION);
$new_filename = uniqid() . '_' . time() . '.' . $extension;

// Move to secure directory
$upload_dir = '../uploads/';
move_uploaded_file($_FILES['file']['tmp_name'], $upload_dir . $new_filename);
```

**Prevent Execution**:
- Store uploads outside web root (or block execution via .htaccess)
- Serve files via PHP script (with proper headers)
- Never trust file extension (check MIME type)

### 12.8 Rate Limiting (Recommended)

**Purpose**: Prevent brute force attacks and API abuse

**Implementation** (pseudocode):
```php
function check_rate_limit($ip, $action, $max_attempts, $time_window) {
    // Count attempts from IP for action in last time_window minutes
    $attempts = count_attempts($ip, $action, $time_window);
    
    if ($attempts >= $max_attempts) {
        Response::error("Too many attempts. Try again later.", 429);
    }
    
    // Log attempt
    log_attempt($ip, $action);
}

// Usage
check_rate_limit($_SERVER['REMOTE_ADDR'], 'login', 5, 15); // 5 attempts per 15 min
```

**Rate Limit Examples**:
- Login: 5 attempts per 15 minutes
- Registration: 3 attempts per hour
- API calls: 100 requests per minute per user

### 12.9 HTTPS Enforcement

**Production Requirements**:
- All traffic over HTTPS
- SSL/TLS certificate (Let's Encrypt recommended)
- Redirect HTTP to HTTPS

**Nginx Configuration**:
```nginx
server {
    listen 80;
    server_name ktrek.my;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ktrek.my;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # ... rest of configuration
}
```

### 12.10 Error Handling and Logging

**Don't Expose Internals**:
```php
// INSECURE: Shows database structure
catch (PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}

// SECURE: Generic message to user, detailed log internally
catch (PDOException $e) {
    error_log("Database error: " . $e->getMessage());
    Response::serverError("An error occurred. Please try again.");
}
```

**Logging Best Practices**:
- Log security events (failed logins, permission denials)
- Log errors with timestamps and context
- Don't log sensitive data (passwords, tokens)
- Rotate logs regularly
- Secure log files (restrict read access)

---

## 13. Performance Optimization

### 13.1 Frontend Performance

**Code Splitting**:
```javascript
// Lazy load routes
const HomePage = React.lazy(() => import('./pages/HomePage'));
const RewardsPage = React.lazy(() => import('./pages/RewardsPage'));

// Use Suspense
<Suspense fallback={<Loading />}>
  <Routes>
    <Route path="/" element={<HomePage />} />
    <Route path="/rewards" element={<RewardsPage />} />
  </Routes>
</Suspense>
```

**Image Optimization**:
- ProxyImage component with lazy loading
- Responsive images (srcset for different sizes)
- WebP format (fallback to JPEG/PNG)
- Image compression before upload
- CDN for static assets

**Bundle Optimization**:
- Vite's automatic code splitting
- Tree shaking (remove unused code)
- Minification in production
- Gzip/Brotli compression

**Caching Strategy**:
```javascript
// Cache API responses
const attractionStore = create((set, get) => ({
  attractions: [],
  lastFetch: null,
  
  fetchAttractions: async () => {
    const now = Date.now();
    const lastFetch = get().lastFetch;
    
    // Cache for 5 minutes
    if (lastFetch && now - lastFetch < 5 * 60 * 1000) {
      return get().attractions;
    }
    
    const data = await attractionsAPI.getAll();
    set({ attractions: data, lastFetch: now });
    return data;
  }
}));
```

### 13.2 Backend Performance

**Database Query Optimization**:

**Use Indexes**:
```sql
-- Index frequently queried columns
CREATE INDEX idx_user_id ON user_task_submissions(user_id);
CREATE INDEX idx_task_id ON user_task_submissions(task_id);
CREATE INDEX idx_token ON sessions(token);
CREATE INDEX idx_qr_code ON tasks(qr_code);
```

**Efficient JOINs**:
```sql
-- GOOD: Use JOINs to fetch related data in one query
SELECT u.*, us.total_xp, us.current_level
FROM users u
LEFT JOIN user_stats us ON u.id = us.user_id
WHERE u.id = :user_id;

-- BAD: N+1 query problem (multiple queries)
SELECT * FROM users WHERE id = :user_id;
SELECT * FROM user_stats WHERE user_id = :user_id;
```

**Limit Results**:
```sql
-- Paginate large result sets
SELECT * FROM attractions
ORDER BY created_at DESC
LIMIT :offset, :limit;
```

**Avoid SELECT ***:
```sql
-- GOOD: Select only needed columns
SELECT id, username, full_name FROM users;

-- BAD: Fetch all columns (including large text fields)
SELECT * FROM users;
```

**Database Connection Pooling**:
- Reuse database connections
- PDO persistent connections: `PDO::ATTR_PERSISTENT => true`

### 13.3 Caching Strategies

**API Response Caching**:
```php
// Cache attraction list for 10 minutes
$cache_key = 'attractions_all';
$cache_file = '../cache/' . $cache_key . '.json';
$cache_time = 600; // 10 minutes

if (file_exists($cache_file) && (time() - filemtime($cache_file)) < $cache_time) {
    // Serve from cache
    $data = json_decode(file_get_contents($cache_file), true);
    Response::success($data, "Attractions loaded (cached)");
}

// Fetch from database and cache
$attractions = fetch_attractions_from_db();
file_put_contents($cache_file, json_encode($attractions));
Response::success($attractions, "Attractions loaded");
```

**Browser Caching**:
```php
// Set cache headers for static assets
header('Cache-Control: public, max-age=86400'); // 1 day
header('Expires: ' . gmdate('D, d M Y H:i:s', time() + 86400) . ' GMT');
```

### 13.4 Database Performance Tuning

**Stored Procedures**:
- Pre-compiled SQL (faster execution)
- Reduce network round-trips
- Complex logic on database server

**Optimize Queries**:
```sql
-- Use EXPLAIN to analyze query performance
EXPLAIN SELECT * FROM user_task_submissions 
WHERE user_id = 1 AND task_id = 5;

-- Check for table scans (bad), index usage (good)
```

**Connection Management**:
- Close database connections after use
- Use persistent connections for high traffic
- Set appropriate timeout values

### 13.5 Asset Optimization

**Image Optimization**:
- Compress images (TinyPNG, ImageOptim)
- Serve appropriate sizes (don't send 4K images for thumbnails)
- Lazy load off-screen images
- Use modern formats (WebP, AVIF)

**CSS/JS Minification**:
- Vite automatically minifies in production
- Remove unused CSS (PurgeCSS)
- Combine files to reduce HTTP requests

**CDN Usage**:
- Serve static assets from CDN (Cloudflare, AWS CloudFront)
- Reduce server load
- Faster delivery (geographically distributed)

---

## 14. Testing and Quality Assurance

### 14.1 Testing Approach

**Manual Testing**:
- User acceptance testing (UAT)
- Exploratory testing
- Cross-browser testing
- Mobile device testing

**Test Coverage Areas**:
1. User authentication (register, login, logout)
2. Attraction browsing and search
3. Task completion (all 7 types)
4. Reward earning and display
5. Progress tracking
6. Admin panel functionality
7. API endpoint functionality
8. Security (authentication, authorization)
9. Performance under load
10. Mobile responsiveness

### 14.2 Browser Compatibility

**Tested Browsers**:
- Chrome/Edge (Chromium) 90+
- Firefox 88+
- Safari 14+
- Mobile Safari (iOS 14+)
- Chrome Mobile (Android 10+)

**Polyfills** (if needed):
- Promise, fetch for older browsers
- IntersectionObserver for lazy loading
- ResizeObserver for responsive components

### 14.3 Mobile Testing

**Responsive Design Testing**:
- iPhone SE (375px width)
- iPhone 12/13/14 (390px width)
- Samsung Galaxy S21 (360px width)
- iPad (768px width)
- Desktop (1920px width)

**Mobile-Specific Features**:
- Touch gestures (swipe, tap, long press)
- Camera access (QR scanning, photo tasks)
- GPS/location services
- Device orientation (compass for direction task)
- Offline behavior
- Performance on limited bandwidth

### 14.4 API Testing

**Tools**:
- Postman for manual API testing
- Browser DevTools Network tab
- cURL for command-line testing

**Test Cases**:
- Valid requests with authentication
- Invalid requests (missing parameters, wrong format)
- Unauthorized requests (no token, expired token)
- Edge cases (empty data, large data)
- Error handling
- Response format consistency

### 14.5 Database Testing

**Test Data**:
- Create test users with various progress levels
- Create test attractions in all categories
- Create test tasks of all types
- Create test rewards with different trigger conditions

**Data Integrity**:
- Foreign key constraints enforced
- Unique constraints prevent duplicates
- Stored procedures function correctly
- Triggers fire as expected
- Transaction rollbacks work

### 14.6 Security Testing

**Security Checks**:
- SQL injection attempts (validate PDO prepared statements work)
- XSS attempts (validate output escaping)
- CSRF attempts (validate token-based auth prevents)
- Authentication bypass attempts
- Authorization bypass attempts (user accessing other user's data)
- File upload exploits (malicious files, large files)
- Rate limiting (brute force protection)

### 14.7 Performance Testing

**Load Testing**:
- Simulate multiple concurrent users
- Test API response times under load
- Monitor database query performance
- Check memory usage
- Identify bottlenecks

**Tools**:
- Apache JMeter
- LoadImpact / k6
- Browser DevTools Performance tab

**Metrics**:
- Page load time < 3 seconds
- API response time < 500ms
- Database queries < 100ms
- Time to interactive < 5 seconds


---

## 15. Deployment Architecture

### 15.1 Deployment Overview

**Deployment Strategy**: Separated frontend and backend hosting

**Frontend Deployment**:
- Platform: Vercel (serverless platform)
- Build command: `npm run build`
- Output directory: `dist/`
- Automatic deployments on Git push
- Custom domain support
- HTTPS by default
- CDN distribution globally

**Backend Deployment**:
- Platform: Traditional PHP hosting or VPS
- Requirements: PHP 7.4+, MySQL 8.0+, Apache/Nginx
- Manual deployment or Git-based deployment
- Database hosted on same or separate server

### 15.2 Frontend Deployment (Vercel)

**Vercel Configuration** (`vercel.json`):
```json
{
  "buildCommand": "cd frontend && npm install && npm run build",
  "outputDirectory": "frontend/dist",
  "framework": "vite",
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Environment Variables**:
- `VITE_API_BASE_URL`: Backend API endpoint
- `VITE_MAPBOX_ACCESS_TOKEN`: Mapbox API key
- `VITE_GOOGLE_CLIENT_ID`: Google OAuth client ID

**Deployment Steps**:
1. Push code to GitHub repository
2. Connect Vercel to GitHub repository
3. Configure build settings
4. Set environment variables
5. Deploy (automatic on every push to main branch)

**Benefits**:
- Zero-config deployment
- Automatic HTTPS
- Instant rollbacks
- Preview deployments for pull requests
- Edge network (fast global delivery)
- Free tier for hobby projects

### 15.3 Backend Deployment (Traditional Hosting)

**Server Requirements**:
- PHP 7.4 or higher
- MySQL 8.0 or higher
- Apache with mod_rewrite OR Nginx
- SSL certificate (Let's Encrypt)
- 1GB+ RAM, 10GB+ storage

**Deployment Steps**:

1. **Upload Files**:
   - FTP/SFTP upload or Git pull
   - Upload `backend/` and `admin/` directories
   - Set proper file permissions (755 for directories, 644 for files)
   - Make `uploads/` writable (755 or 777)

2. **Database Setup**:
   ```bash
   mysql -u root -p < admin/database.sql
   mysql -u root -p ktrek_db < admin/database_updates.sql
   mysql -u root -p ktrek_db < admin/migrations/*.sql
   ```

3. **Configuration**:
   - Update `backend/config/database.php` with production credentials
   - Update `backend/config/cors.php` with production domain
   - Set `display_errors = 0` in php.ini

4. **Apache Configuration** (`.htaccess`):
   ```apache
   RewriteEngine On
   RewriteCond %{HTTPS} off
   RewriteRule ^(.*)$ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]
   
   # Prevent directory listing
   Options -Indexes
   
   # Protect sensitive files
   <FilesMatch "^\.">
     Order allow,deny
     Deny from all
   </FilesMatch>
   ```

5. **SSL Certificate**:
   ```bash
   sudo certbot --apache -d api.ktrek.my
   ```

### 15.4 Database Deployment

**Database Hosting Options**:
- Same server as backend (development)
- Separate database server (production)
- Managed database service (AWS RDS, DigitalOcean Managed Database)

**Database Migration**:
```bash
# Export from development
mysqldump -u root -p ktrek_db > ktrek_backup.sql

# Import to production
mysql -u production_user -p ktrek_db < ktrek_backup.sql

# Run migrations
mysql -u production_user -p ktrek_db < admin/migrations/2026-01-26_complete_fix.sql
```

**Database Configuration**:
- Enable binary logging for backups
- Set up automated daily backups
- Configure replication for high availability (optional)
- Optimize MySQL settings for production

### 15.5 Environment Configuration

**Development Environment** (`.env.development`):
```
API_BASE_URL=http://localhost/ktrek/backend/api
DB_HOST=localhost
DB_NAME=ktrek_db
DB_USER=root
DB_PASS=
```

**Production Environment** (`.env.production`):
```
API_BASE_URL=https://api.ktrek.my
DB_HOST=production-db-server
DB_NAME=ktrek_production
DB_USER=ktrek_user
DB_PASS=secure_password
```

### 15.6 Deployment Checklist

**Pre-Deployment**:
- [ ] All features tested and working
- [ ] Database migrations prepared
- [ ] Environment variables configured
- [ ] SSL certificates obtained
- [ ] Backup strategy in place
- [ ] Error logging configured
- [ ] Performance testing completed

**During Deployment**:
- [ ] Upload/deploy backend files
- [ ] Import database and run migrations
- [ ] Deploy frontend to Vercel
- [ ] Update DNS records
- [ ] Test all endpoints
- [ ] Verify authentication works
- [ ] Test task submissions
- [ ] Check admin panel

**Post-Deployment**:
- [ ] Monitor error logs
- [ ] Check server resources (CPU, memory, disk)
- [ ] Set up uptime monitoring
- [ ] Configure backups
- [ ] Document deployment process
- [ ] Train administrators

### 15.7 Continuous Deployment

**Git Workflow**:
```
main (production)
  +-- develop (staging)
        +-- feature/new-task-type (feature branches)
```

**Deployment Flow**:
1. Develop features in feature branches
2. Merge to `develop` for staging testing
3. Merge to `main` for production deployment
4. Vercel auto-deploys on push to `main`
5. Backend deployed manually or via CI/CD

**CI/CD Pipeline** (optional):
- GitHub Actions or GitLab CI
- Automated testing on push
- Automated deployment on merge to main
- Rollback on failure

### 15.8 Monitoring and Maintenance

**Monitoring Tools**:
- Uptime monitoring (UptimeRobot, Pingdom)
- Error tracking (Sentry)
- Performance monitoring (New Relic, DataDog)
- Google Analytics for user behavior

**Maintenance Tasks**:
- Weekly: Review error logs
- Monthly: Database optimization and cleanup
- Quarterly: Security updates
- Annually: Server OS updates

### 15.9 Backup Strategy

**Database Backups**:
```bash
# Daily automated backup
0 2 * * * mysqldump -u backup_user -p ktrek_db | gzip > /backups/ktrek_$(date +\%Y\%m\%d).sql.gz

# Rotate backups (keep last 30 days)
find /backups/ -name "ktrek_*.sql.gz" -mtime +30 -delete
```

**File Backups**:
- Backup `uploads/` directory daily
- Backup codebase (version controlled via Git)
- Store backups offsite (AWS S3, Google Drive)

**Disaster Recovery**:
- Document recovery procedures
- Test restore process quarterly
- Keep recent backups accessible
- Maintain emergency contact list

### 15.10 Scaling Considerations

**Vertical Scaling** (current architecture):
- Increase server resources (CPU, RAM, storage)
- Upgrade database server
- Optimize queries and indexes

**Horizontal Scaling** (future):
- Load balancer for multiple backend servers
- Database replication (master-slave)
- CDN for static assets
- Redis/Memcached for caching
- Queue system for background jobs (email, notifications)

---

## 16. System Features Summary

### 16.1 User Features

**Authentication**:
- ? Email/phone registration
- ? Email/phone login
- ? Google OAuth login
- ? Password reset
- ? Avatar customization (DiceBear)
- ? Profile management

**Attraction Discovery**:
- ? Browse attractions by category
- ? Interactive map with markers
- ? Search and filter
- ? Distance calculation
- ? Navigation to attractions
- ? Attraction details page

**Task Completion**:
- ? Check-in (QR code scanning)
- ? Quiz (multiple choice)
- ? Direction (compass navigation)
- ? Observation Match
- ? Count Confirm
- ? Time-Based
- ? Photo tasks (partial)

**Gamification**:
- ? XP and level system
- ? EP (Exploration Points)
- ? Badge collection
- ? Title system
- ? Category tiers (bronze/silver/gold)
- ? Leaderboard
- ? Progress tracking
- ? Reward notifications

**Social Features**:
- ? Leaderboard rankings
- ? User profiles with stats
- ? Share achievements (future)
- ? Friend system (future)

**User Engagement**:
- ? Progress dashboard
- ? Rewards page
- ? Category milestones
- ? Achievement animations
- ? Report/feedback system

### 16.2 Admin Features

**Dashboard**:
- ? System statistics
- ? User analytics
- ? Activity charts
- ? Recent activity feed

**Content Management**:
- ? Create/edit/delete attractions
- ? Create/edit/delete tasks
- ? Upload images
- ? Generate QR codes
- ? Task configuration (JSON editor)

**User Management**:
- ? View all users
- ? User details and statistics
- ? Deactivate users
- ? Manual reward awarding
- ? Password reset

**Reward Management**:
- ? Create/edit rewards
- ? Configure trigger conditions
- ? Set rarity levels
- ? View reward analytics

**Report Management**:
- ? View user reports
- ? Reply to reports
- ? Mark as resolved

**System Management**:
- ? Audit log
- ? Admin user management
- ? Role-based access control
- ? System settings page (partial)

### 16.3 Technical Features

**Frontend**:
- ? React 18 with hooks
- ? Vite build system
- ? Tailwind CSS styling
- ? Zustand state management
- ? React Router v6
- ? Responsive design
- ? PWA-ready (partial)

**Backend**:
- ? RESTful PHP APIs
- ? Token-based authentication
- ? PDO prepared statements
- ? Stored procedures
- ? Transaction support
- ? Error handling
- ? CORS configuration

**Database**:
- ? Normalized schema
- ? Foreign keys with constraints
- ? Indexes for performance
- ? Stored procedures
- ? Triggers (optional)
- ? Migration system

**Security**:
- ? Password hashing (bcrypt)
- ? SQL injection prevention (PDO)
- ? XSS prevention
- ? CSRF protection (token-based)
- ? Input validation
- ? File upload security
- ? Rate limiting (recommended)

**Integrations**:
- ? Mapbox maps
- ? Google OAuth
- ? QR code generation/scanning
- ? DiceBear avatars
- ? Email service (future)

---

## 17. Technical Achievements

### 17.1 Architecture Achievements

**Modern Tech Stack**:
- Successfully implemented React + PHP architecture
- Separated concerns (frontend, backend, database)
- RESTful API design
- Token-based authentication (stateless)

**Scalable Design**:
- Modular component structure
- Reusable UI components
- Centralized state management
- Database normalization (3NF)
- Prepared for horizontal scaling

**Performance Optimization**:
- Lazy loading components
- API response caching
- Database indexes
- Optimized queries with JOINs
- Image optimization

### 17.2 Gamification Achievements

**Comprehensive Reward System**:
- XP/EP dual-point system
- Level progression with exponential curve
- 4 reward types (badges, titles, cosmetics, photo cards)
- 4 rarity tiers (common, rare, epic, legendary)
- 5 trigger types for automatic reward awarding
- Category tier system (bronze/silver/gold)
- Leaderboard with grand master status

**Reward Logic**:
- Automated reward calculation (RewardHelper class)
- Stored procedures for XP awarding
- Duplicate prevention
- Transaction-safe reward awarding
- Real-time notification system

**User Engagement**:
- Progress tracking per attraction and category
- Visual progress indicators
- Achievement animations (TierUnlockModal)
- Reward notification queue
- Milestone celebrations

### 17.3 Task System Achievements

**7 Task Types Implemented**:
1. Check-in (QR code validation)
2. Quiz (multiple choice with scoring)
3. Direction (compass navigation)
4. Observation Match (drag-and-drop pairing)
5. Count Confirm (counting validation)
6. Time-Based (time window restrictions)
7. Photo (partial - upload working)

**Task Features**:
- Task ordering system (check-in first)
- Prerequisite checking
- JSON-based configuration
- Flexible task metadata
- Instant feedback and scoring
- Retry capability (where appropriate)

**Educational Value**:
- Quiz questions test cultural knowledge
- Direction tasks guide observation
- Observation match teaches connections
- Count tasks encourage detailed exploration
- Time-based tasks respect cultural norms

### 17.4 Location-Based Achievements

**Geolocation Integration**:
- Interactive Mapbox maps
- Real-time user location
- Distance calculation (Haversine formula)
- Navigation to attractions
- Optional location-based check-in validation

**Map Features**:
- Category-colored markers
- Clustered markers for nearby attractions
- Popup information windows
- Fly-to animation
- User location marker

### 17.5 Security Achievements

**Authentication Security**:
- Bcrypt password hashing (cost 12)
- Cryptographically secure tokens
- Token expiration enforcement
- Multi-device session support
- Google OAuth integration

**Application Security**:
- SQL injection prevention (PDO)
- XSS prevention (JSON responses, React escaping)
- CSRF protection (token-based auth)
- Input validation and sanitization
- Secure file uploads

**Best Practices**:
- HTTPS enforcement (production)
- Secure headers
- Error handling without information leakage
- Audit logging
- Role-based access control

### 17.6 User Experience Achievements

**Responsive Design**:
- Mobile-first approach
- Tested on multiple devices
- Touch-optimized interactions
- Adaptive layouts

**Interactive UI**:
- Smooth animations (Framer Motion)
- Loading states (custom loader components)
- Toast notifications
- Modal dialogs
- Progress indicators

**Accessibility** (partial):
- Semantic HTML
- Keyboard navigation
- Alt text for images
- Color contrast (Tailwind defaults)

### 17.7 Code Quality Achievements

**Frontend**:
- Modern React patterns (hooks, functional components)
- Component reusability
- Centralized API layer
- Consistent naming conventions
- Organized file structure

**Backend**:
- PDO abstraction
- Response helper for consistency
- Middleware pattern for authentication
- Utility functions for common operations
- Error handling and logging

**Database**:
- Normalized schema
- Foreign key constraints
- Stored procedures for complex logic
- Indexes for performance
- Migration system for version control

---

## 18. Challenges and Solutions

### 18.1 Authentication Challenge

**Challenge**: Implementing secure, stateless authentication without a framework

**Solution**:
- Token-based authentication using cryptographically secure random tokens
- Store tokens in database with expiration
- Middleware pattern for token validation
- Frontend stores token in localStorage
- Bearer token in Authorization header

**Lessons Learned**:
- Stateless auth is more scalable than PHP sessions
- Token expiration must be enforced at database level
- Secure random token generation is critical
- HTTPS is essential for token security

### 18.2 Reward System Complexity

**Challenge**: Automatically awarding rewards based on various trigger conditions

**Solution**:
- Centralized RewardHelper class for all reward logic
- JSON-based trigger conditions for flexibility
- Stored procedures for complex database operations
- Transaction-safe reward awarding
- Duplicate prevention checks

**Lessons Learned**:
- Centralized logic prevents inconsistencies
- Stored procedures improve performance for complex operations
- Thorough testing required for edge cases
- Clear documentation of trigger condition formats is essential

### 18.3 Task Type Flexibility

**Challenge**: Supporting multiple task types with different configurations

**Solution**:
- Generic tasks table with type ENUM
- JSON task_config column for type-specific settings
- Separate submission handlers per task type
- Frontend components per task type
- Shared submission logic for common operations

**Lessons Learned**:
- JSON columns provide flexibility without schema changes
- Type-specific handlers keep code organized
- Consistent API patterns reduce complexity
- Clear documentation of config schemas is vital

### 18.4 Database Performance

**Challenge**: Slow queries as data grows

**Solution**:
- Added indexes on foreign keys and frequently queried columns
- Used JOINs instead of multiple queries (N+1 problem)
- Implemented stored procedures for complex operations
- Limited result sets with pagination
- Cached frequent queries

**Lessons Learned**:
- Indexes dramatically improve query performance
- EXPLAIN query plans help identify bottlenecks
- Stored procedures reduce network overhead
- Caching should be implemented early

### 18.5 Mobile Responsiveness

**Challenge**: Complex UI components not working well on small screens

**Solution**:
- Mobile-first design approach
- Tailwind CSS responsive utilities
- Touch-optimized interactions
- Bottom navigation for mobile
- Simplified mobile layouts

**Lessons Learned**:
- Mobile-first is easier than desktop-first
- Test on real devices early and often
- Touch targets must be large enough (44x44px minimum)
- Simplify complex interactions for mobile

### 18.6 QR Code Validation

**Challenge**: Ensuring QR codes can't be reused or shared

**Solution**:
- Task-specific QR codes (include task_id)
- Optional timestamp expiration
- Optional GPS validation
- One check-in per user per task (database constraint)
- Server-side validation (don't trust client)

**Lessons Learned**:
- Client-side validation is for UX, server-side for security
- Multiple validation layers improve security
- Balance security with user convenience
- Clear error messages for failed validations

### 18.7 State Management

**Challenge**: Complex state management without Redux

**Solution**:
- Zustand for lightweight global state
- Separate stores for different domains
- LocalStorage persistence for auth
- React hooks for local component state
- Custom hooks for shared logic

**Lessons Learned**:
- Zustand is simpler and lighter than Redux
- Not all state needs to be global
- Persistence layer simplifies auth state
- Clear store organization prevents confusion

### 18.8 Deployment Complexity

**Challenge**: Deploying React frontend and PHP backend separately

**Solution**:
- Vercel for frontend (automatic deployments)
- Traditional hosting for backend
- Environment variables for configuration
- CORS configuration for cross-origin requests
- Clear deployment documentation

**Lessons Learned**:
- Separate deployments allow independent scaling
- Environment variables simplify configuration
- CORS must be configured correctly for production
- Automated frontend deployment saves time

### 18.9 Error Handling

**Challenge**: Providing useful errors without exposing security details

**Solution**:
- Generic error messages to users
- Detailed logging for developers
- Consistent error format (JSON)
- HTTP status codes for error types
- Frontend error boundary components

**Lessons Learned**:
- Balance user-friendly errors with security
- Comprehensive logging is essential for debugging
- Consistent error format simplifies frontend handling
- Test error cases thoroughly

### 18.10 Feature Scope Management

**Challenge**: Balancing feature completeness with development time

**Solution**:
- Prioritized core features (MVP)
- Deferred nice-to-have features
- Documented future enhancements
- Iterative development approach
- Focus on working implementation over perfection

**Lessons Learned**:
- MVP approach prevents scope creep
- Documentation of future features aids planning
- Working system is better than perfect unfinished system
- User feedback guides future priorities

---

## 19. Future Enhancements

### 19.1 Feature Enhancements

**Social Features**:
- Friend system (add friends, see their progress)
- Activity feed (see friends' achievements)
- Team challenges (group tasks)
- Social sharing (share achievements to social media)

**Advanced Gamification**:
- Seasonal events with special rewards
- Daily/weekly challenges
- Streak system (consecutive days)
- Achievement showcases
- Custom avatar items earned through gameplay

**Content Expansion**:
- More task types (audio tours, augmented reality)
- Interactive 360° attraction views
- Video guides from local experts
- User-generated content (reviews, tips)
- Multi-language support (Bahasa Malaysia, Chinese, Thai)

**Mobile App**:
- Native iOS and Android apps
- Better offline support
- Push notifications
- Background location tracking
- Enhanced camera features

### 19.2 Technical Enhancements

**Performance**:
- Redis caching layer
- Database query optimization
- CDN for images
- Progressive Web App (full PWA)
- Service workers for offline support

**Security**:
- Rate limiting implementation
- Two-factor authentication (2FA)
- Email verification required
- IP-based fraud detection
- CAPTCHA for registration

**Analytics**:
- User behavior analytics (Mixpanel, Amplitude)
- A/B testing framework
- Conversion funnel tracking
- Heatmaps and session recordings
- Custom admin analytics dashboard

**Infrastructure**:
- Automated backups
- CI/CD pipeline (GitHub Actions)
- Staging environment
- Load balancing for scalability
- Containerization (Docker)

### 19.3 User Experience Enhancements

**Accessibility**:
- Screen reader support
- ARIA labels
- Keyboard navigation improvements
- High contrast mode
- Text size adjustment

**Personalization**:
- Recommended attractions based on interests
- Smart notifications (nearby attractions)
- Customizable dashboard
- Preferred categories
- Learning path suggestions

**Offline Support**:
- Download attractions for offline viewing
- Queue task submissions when offline
- Cached map tiles
- Offline progress tracking
- Sync when online

### 19.4 Admin Enhancements

**Content Management**:
- Bulk import/export (CSV, JSON)
- Content scheduling (publish dates)
- Content versioning
- Media library management
- Template system for common tasks

**Analytics Dashboard**:
- Custom report builder
- Export to PDF/Excel
- Real-time user activity
- Cohort analysis
- Retention metrics

**Automation**:
- Automated reward testing
- Batch operations (bulk activate/deactivate)
- Scheduled reports
- Alert system for anomalies
- Auto-moderation for user content

---

## 20. Conclusion

### 20.1 Project Summary

K-Trek successfully implements a **location-based gamified tourism web application** that promotes Kelantan's cultural heritage through interactive digital experiences. The system combines modern web technologies with gamification mechanics to create an engaging platform for tourists.

### 20.2 Key Accomplishments

**Technical**:
- ? Full-stack web application (React + PHP + MySQL)
- ? Token-based authentication system
- ? 7 interactive task types
- ? Comprehensive reward and gamification system
- ? Location-based features with Mapbox
- ? Admin panel for content management
- ? Responsive mobile-first design

**Functional**:
- ? User registration and authentication (including Google OAuth)
- ? Attraction discovery with interactive map
- ? Task completion with instant feedback
- ? Automated reward awarding
- ? Progress tracking and statistics
- ? Leaderboard and competitive elements
- ? Admin content management

**Impact**:
- ?? Promotes cultural heritage awareness
- ?? Increases tourist engagement through gamification
- ?? Provides educational content about Kelantan
- ?? Accessible via web (no app download required)
- ?? Scalable architecture for future growth

### 20.3 System Readiness

**Production Readiness**: 85%
- Core features: ? Complete and tested
- Security: ? Implemented with best practices
- Performance: ? Optimized for typical usage
- Deployment: ? Partially configured (needs production environment)
- Documentation: ? Comprehensive
- Testing: ? Manual testing complete, automated testing recommended

**Deployment Status**:
- Frontend: Ready for Vercel deployment
- Backend: Ready for traditional PHP hosting
- Database: Schema and migrations complete
- Integrations: API keys and configurations needed

### 20.4 Lessons Learned

1. **Architecture Decisions**: Separating frontend and backend enables independent scaling and development
2. **Gamification Effectiveness**: Automated reward system increases engagement and retention
3. **User Experience**: Mobile-first design is essential for tourism applications
4. **Security First**: Implementing security from the start prevents costly refactoring
5. **Documentation**: Comprehensive documentation accelerates development and onboarding

### 20.5 Recommendations for Deployment

**Before Launch**:
1. Complete production environment setup
2. Perform load testing with expected user volume
3. Implement rate limiting for API security
4. Set up automated database backups
5. Configure monitoring and alerting
6. Train admin users on content management
7. Create user documentation and tutorials

**Post-Launch**:
1. Monitor error logs and user feedback
2. Gather analytics on user behavior
3. Iterate based on user feedback
4. Plan content updates (new attractions, tasks)
5. Engage community for user-generated content

### 20.6 Final Notes

This documentation provides a comprehensive overview of the K-Trek system for thesis documentation purposes. It covers architecture, implementation details, features, challenges, and future enhancements. The system demonstrates successful integration of modern web technologies with gamification mechanics to create an engaging cultural tourism platform.

For thesis Chapter 4 (Results and Discussion), this documentation can be used to:
- Explain system architecture and design decisions
- Describe implemented features and their technical details
- Discuss challenges encountered and solutions implemented
- Present system capabilities and achievements
- Analyze performance and security aspects
- Propose future enhancements based on current limitations

**Document Version**: 1.0  
**Last Updated**: January 26, 2026  
**Author**: K-Trek Development Team  
**Purpose**: Thesis Chapter 4 Reference Documentation

---

*End of System Documentation*

