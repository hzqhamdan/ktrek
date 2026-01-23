# Admin JavaScript Refactoring Plan

## Current State
- **File:** `admin/javascript/main.js`
- **Lines:** 3,314 lines
- **Functions:** ~114 functions
- **Problem:** Monolithic file, hard to maintain

## Proposed Module Structure

### 1. **auth.js** - Authentication & Session Management
```javascript
// Functions:
- checkSession()
- showRegisterForm()
- showLoginForm()
- handleRegister(e)
- handleLogin(e)
- logout()
- toggleProfileDropdown()
- editProfile()
- closeEditProfileModal()
- handleEditProfileSubmit(event)
- showLoginAlert(message, type)
- showRegisterAlert(message, type)
```

### 2. **dashboard.js** - Dashboard & Stats Display
```javascript
// Functions:
- showDashboard()
- showManagerDashboard()
- showSuperadminDashboard()
- loadSuperadminDashboard(periodDays)
- loadDashboardStats()
- renderTaskCompletionChart(chartData)
- renderUserActivityChart(chartData)
- renderLeaderboard(leaderboard)
- toggleChartPeriod(period)
- renderSaRisk(risks, meta)
- renderSaManagersTable(rows)
- saRenderLineChart(...)
- renderSaGrowth(growth)
- renderSaRecent(recent)
- saBadge(status)
- saFmtDate(ts)
```

### 3. **attractions.js** - Attractions Management
```javascript
// Functions:
- loadAttractions()
- fetchAttractionsList()
- displayAttractions(attractions)
- sortAttractions(attractions)
- applyAttractionSort()
- openAttractionModal(id)
- loadAttractionData(id)
- closeAttractionModal()
- handleAttractionSubmit(e)
- editAttraction(id)
- deleteAttraction(id)
- loadAttractionFilterDropdown(selectId)
- loadAttractionDropdown(selectId)
```

### 4. **tasks.js** - Tasks Management
```javascript
// Functions:
- loadTasks()
- displayTasks(tasks)
- applyTaskFilters()
- clearTaskFilters()
- openTaskModal(id)
- loadTaskData(id)
- closeTaskModal()
- handleTaskSubmit(e)
- handleTaskTypeChange()
- addQuizQuestion()
- removeQuizQuestion(questionIndex)
- addQuizOption(questionIndex)
- removeQuizOption(questionIndex, optionIndex)
- editTask(id)
- deleteTask(id)
- loadTasksDropdown(selectId, attractionId)
- addTaskInput()
- removeTaskInput(groupId)
- collectInitialTaskData()
- openTaskAndGuideModal(attractionId)
- handleTaskAndGuideSubmit(e)
- closeTaskAndGuideModal()
- addMoreTaskAndGuide()
```

### 5. **guides.js** - Guides Management
```javascript
// Functions:
- loadGuides()
- displayGuides(guides)
- applyGuideFilters()
- clearGuideFilters()
- openGuideModal(id)
- loadGuideData(id)
- closeGuideModal()
- handleGuideSubmit(e)
- editGuide(id)
- deleteGuide(id)
- addGuideInput()
- removeGuideInput(groupId)
- collectInitialGuideData()
```

### 6. **users.js** - User Management
```javascript
// Functions:
- loadUsers()
- displayUsers(users)
- applyUserFilters()
- clearUserFilters()
- viewUser(id)
- deleteUser(id)
- resetUserPassword(id)
- loadUserProgress()
```

### 7. **reports.js** - Reports & Progress
```javascript
// Functions:
- loadReports()
- displayReports(reports)
- applyReportFilters()
- clearReportFilters()
- viewReport(id)
- resolveReport(id)
- deleteReport(id)
- loadProgressData()
```

### 8. **rewards.js** - Rewards Management
```javascript
// Functions:
- loadRewards()
- displayRewards(rewards)
- openRewardModal(id)
- closeRewardModal()
- handleRewardSubmit(e)
- editReward(id)
- deleteReward(id)
```

### 9. **qr.js** - QR Code Generation
```javascript
// Functions:
- generateQRToken()
- generateSecureToken()
- showQRPreview(token)
- downloadQRCode()
```

### 10. **utils.js** - Utility Functions
```javascript
// Functions:
- showSection(section)
- navigateTo(section)
- switchTab(tabName)
- loadTabData(tabName)
- getTimeAgo(timestamp)
- showAlert(message, type)
- showFormAlert(formElement, message, type)
- clearFormAlerts(formElement)
- showTableLoading(tableBodyId)
- uploadFile(fileInputId)
- validateFormFields(fieldIds)
```

### 11. **init.js** - Initialization & Setup
```javascript
// Functions:
- setupEventListeners()
- setupRoleBasedTaskAndGuideFilters()
- checkSession() [called on load]
```

### 12. **main.js** (NEW - Entry Point)
```javascript
// Imports all modules
// Initializes the application
// Minimal code, just orchestration

import * as Auth from './auth.js';
import * as Dashboard from './dashboard.js';
// ... etc

// On load
document.addEventListener('DOMContentLoaded', () => {
    Init.setupEventListeners();
    Auth.checkSession();
});
```

## Implementation Strategy

### Phase 1: Create Module Files
1. Create folder: `admin/javascript/modules/`
2. Create empty module files for each category
3. Keep original `main.js` as backup

### Phase 2: Extract Functions (Module by Module)
1. Start with **utils.js** (no dependencies)
2. Then **auth.js** (uses utils)
3. Then **dashboard.js**, **attractions.js**, etc.
4. Export all functions: `export function functionName() {}`

### Phase 3: Create New main.js
1. Import all modules
2. Expose functions globally for inline HTML handlers
3. Initialize on load

### Phase 4: Update HTML (admin/index.php)
1. Update script imports
2. Change inline handlers from `onclick="functionName()"` to `onclick="Module.functionName()"`
3. OR expose functions globally via window object

### Phase 5: Testing
1. Test each section: Login, Dashboard, Attractions, Tasks, etc.
2. Verify all CRUD operations work
3. Check no broken references

## Benefits
- ✅ Modular, maintainable code
- ✅ Easy to find functions
- ✅ Smaller files (~200-400 lines each)
- ✅ Better for version control
- ✅ Easier to add new task types
- ✅ Can be tested independently

## Notes
- Keep backward compatibility during refactor
- Use ES6 modules (import/export)
- Can incrementally migrate (one module at a time)
- Original main.js stays as backup until complete
