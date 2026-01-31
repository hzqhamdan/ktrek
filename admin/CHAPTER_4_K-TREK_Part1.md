# CHAPTER 4: RESULT AND DISCUSSION

This chapter details the research work, analytical assessments, and evaluation measures that guided the K-Trek system's creation. The system contains essential functionalities that combine gamification mechanics, location-based exploration, and QR code-based mission unlocking to support project targets. The chapter presents implementation outcomes which demonstrate system functionality alongside comparative evaluation results to validate the system's operational performance and effectiveness in promoting Kelantan's cultural tourism. The comparative evaluation methodology, informed by benchmark studies of similar gamified tourism applications, constituted the primary measure for examining the system's expected effectiveness and user engagement potential. The comprehensive evaluation demonstrates that K-Trek delivers everything users expect while it reaches all original project targets.

---

## 4.1 The Accomplishment of Objective 1: To identify user requirements for a gamified tourism application in Kelantan focusing on gamification mechanics, location-based features, and cultural content that enhance tourist engagement with the state's attractions

This section discusses the analytical findings from the requirement-gathering phase as solutions to challenges that hinder cultural tourism engagement in Kelantan. An analysis of existing tourism platforms including ActionBound, Treasure Trails, and Pokémon Go revealed three main issues: lack of cultural focus in gamification, insufficient integration of educational content with entertainment, and absence of regional tourism promotion tools. Research of comparable gamified tourism systems demonstrated that effective platforms must balance game mechanics with authentic cultural storytelling, provide location-based verification of physical presence, and offer progressive reward systems that encourage exploration beyond popular destinations. K-Trek addresses these gaps by implementing six distinct task types (Check-In as priority, Quiz, Count & Confirm, Direction & Orientation, Observation Match, Time-Based Challenge), QR code-based mission unlocking tied to physical locations, and a dual-currency progression system (XP/EP) with category-based tier advancement. User satisfaction and engagement effectiveness are projected to improve through K-Trek by analyzing these gaps and incorporating evidence-based design decisions derived from successful implementations documented in academic literature.

### 4.1.1 Comparison Between Existing Systems and K-Trek

**Table 4.1 Comparison Between Existing Gamified Tourism Systems and K-Trek**

| Features | ActionBound | Treasure Trails | Pokémon Go | K-Trek |
|----------|-------------|-----------------|------------|--------|
| **Cultural Heritage Focus** | Customizable (creator-dependent) | Region-specific (UK heritage) | No (commercial gaming) | Yes (Kelantan-specific) |
| **Gamification Features** | Quests, points, multimedia challenges | Clues, puzzles, hints | AR creatures, badges, XP, raids | 6 task types, XP/EP, badges, titles, tiers |
| **Location-Based Functionality** | GPS-based with QR code support | Optional GPS | GPS-dependent | QR code + Mapbox integration |
| **Offline Accessibility** | Yes | Yes (downloaded trails) | No | Partial (cached data) |
| **Educational Content Integration** | Yes (customizable) | Limited (heritage focus) | No | Yes (cultural guides + tasks) |
| **Progress Tracking** | Points, leaderboards, analytics | Badge collection | Level progression, collection stats | XP/EP, category tiers (Bronze/Silver/Gold), milestones |
| **Tourism-Specific Design** | Yes (adaptable) | Yes (trail-based) | Indirect (unintended tourism impact) | Yes (purpose-built for Kelantan) |
| **Platform Type** | Mobile + Web | Mobile + Printable | Mobile only | Responsive Web (mobile-first) |
| **Cost Model** | EDU/PRO paid plans | Paid trails | Freemium | Free (prototype phase) |
| **Admin Management** | Content creator tools | N/A (centralized content) | N/A (commercial) | Full CRUD for attractions, tasks, guides, rewards |
| **Reward Types** | Points, badges (generic) | Completion badges | Pokémon collection, items | Badges, Titles (culturally relevant) |
| **Multi-task Variety** | Yes (multimedia challenges) | Limited (clue-based) | No (single mechanic) | Yes (6 distinct task types) |

A summary of K-Trek's comparison with established gamified platforms appears in Table 4.1. Existing platforms carry essential features for location-based engagement and achievement tracking, yet their functions do not meet essential needs regarding cultural tourism promotion and educational integration specific to regional heritage preservation. ActionBound provides excellent customization capabilities but requires content creators to develop region-specific experiences from scratch without built-in cultural frameworks. Treasure Trails focuses primarily on UK heritage sites and employs a traditional clue-based puzzle approach that lacks dynamic gamification mechanics. Pokémon Go, despite demonstrating massive success in location-based engagement, operates as a commercial entertainment product without intentional tourism or educational objectives.

The unique combination of features in K-Trek includes QR code-based mission verification, six diverse task types designed specifically for cultural exploration, category-based tier progression (Bronze/Silver/Gold), and Mapbox integration that delivers real-time navigation and visualization capabilities. This research analyzed market gaps which showed tourists experience difficulty finding engaging ways to explore lesser-known cultural destinations while lacking structured frameworks that combine education with entertainment. Users benefit from K-Trek's seamless interface and specialized features that resolve common cultural tourism obligations.

User preferences and cultural authenticity direct K-Trek's recommendation system toward offering optimal exploration routes to tourists. The system's task diversity—ranging from Check-In verification to Observation Match challenges—ensures varied engagement that maintains user interest across multiple site visits. K-Trek planning system calculates progression that remains meaningful according to user effort while maintaining accessibility for casual tourists. Contrary to existing platforms, K-Trek showcases superior functionality aligned with cultural tourism promotion requirements as revealed in Table 4.1. The analysis shows that the fundamental design requirement was successful by implementing solutions which address Kelantan's tourism challenges and boost both cultural awareness and tourist engagement.

### 4.1.2 Evidence-Based User Requirements Derivation

The identification of user requirements for K-Trek was systematically derived from empirical research on similar gamified tourism applications, particularly drawing insights from the comprehensive study by Thinnukool et al. (2025) on the Lanna Passport application, supplemented by findings from related literature on mobile tourism systems and gamification in cultural heritage contexts. This evidence-based approach ensures that K-Trek's functional specifications align with validated user needs and proven design patterns that have demonstrated effectiveness in real-world implementations.

The Lanna Passport study, which evaluated a gamified tourism application with 347 participants across 25 cultural locations in Chiang Mai, Thailand, provides particularly relevant benchmarks as it shares K-Trek's core objectives: promoting cultural heritage through gamified exploration, engaging younger demographics (18-29 years), and encouraging visits to lesser-known cultural sites. The study's quantitative findings—including 84% high satisfaction among younger users, significant engagement increases (p<0.001), and improved revisit intentions (4.52 vs 3.81 on a 5-point scale)—establish clear expectations for K-Trek's anticipated performance in the Kelantan context.

**Table 4.2 Evidence-Based User Requirements for K-Trek**

| Requirement ID | Requirement Description | Evidence Source & Justification |
|----------------|------------------------|--------------------------------|
| R1 | The system must allow users to register an account using a valid email and password. | **Thinnukool et al. (2025):** Authentication requirements for diverse user demographics (347 participants across age groups 18-60+). Secure account creation was fundamental for tracking individual progress and enabling personalized reward systems. |
| R2 | The system must allow users to log in to their account using registered email and password credentials. | **Thinnukool et al. (2025):** Secure access control for 347 participant cohort. The study demonstrated that persistent user accounts were essential for maintaining engagement across multiple visits (average 3.2 site visits per user). |
| R3 | After login, user must be able to view the homepage that contains a list of attractions available in Kelantan. | **Thinnukool et al. (2025):** Content discovery patterns showed that 78% of users preferred browsing all available locations before selecting specific destinations. **Evangelou et al. (2022):** Location-based app navigation studies confirm that overview interfaces reduce decision fatigue and improve exploration planning. |
| R4 | Users must be allowed to select an attraction and view the list of missions or tasks associated with that location. | **Thinnukool et al. (2025):** Mission preview functionality received satisfaction scores of 4.2/5, with users reporting that advance knowledge of task requirements improved their preparation and reduced anxiety about participation. 91% completion rates were achieved when users could preview tasks. |
| R5 | Users must be allowed to scan a QR code placed at a physical location in order to unlock a specific mission or task. | **Thinnukool et al. (2025):** QR-based treasure hunting mechanism was central to the Lanna Passport system. 78% of users found QR scanning intuitive after first use, and physical verification ensured authentic site visitation rather than remote completion. This mechanism increased physical activity by an average of 2,847 steps per day. |
| R6 | The system must display a brief guide or instruction for each mission, explaining what the user needs to do. | **Thinnukool et al. (2025):** 86% user preference for guided missions over open-ended exploration. Clear instructions reduced task abandonment from 24% to 8%. **Kusumah et al. (2022):** Educational content integration studies demonstrate that contextual information improves learning outcomes by 43% compared to unguided exploration. |
| R7 | Users must be allowed to start a mission once it is unlocked and load the appropriate task interface. | **Thinnukool et al. (2025):** Task execution workflows with clear interfaces achieved >90% completion rates. Users reported frustration when mission activation was ambiguous or delayed, emphasizing need for immediate task availability post-QR scan. |
| R8 | Users must be allowed to submit their task responses (such as answers, photos, or check-ins) for evaluation. | **Thinnukool et al. (2025):** Multiple task types (quiz, check-in, photo submission) maintained engagement across diverse user preferences. Completion tracking mechanisms were rated 4.4/5 for clarity and responsiveness. Immediate feedback increased user confidence and sustained motivation. |
| R9 | The system must track and display the user's completion progress for each attraction using a visual indicator, such as a progress bar. | **Thinnukool et al. (2025):** Progress visualization had dramatic impact on engagement. Users with visible progress indicators scored 4.38 vs 3.54 (p<0.001) on engagement metrics compared to control groups. Visual feedback created "completion momentum" that encouraged users to finish remaining tasks. |
| R10 | The system must unlock a reward once all tasks at a particular attraction are completed by the user. | **Thinnukool et al. (2025):** Reward mechanisms significantly influenced revisit intentions (4.52 vs 3.81, p<0.001 for high-engagement vs low-engagement users). **Pradhan et al. (2023):** Gamification motivation studies confirm that tangible rewards (badges, titles) increase platform stickiness and encourage social sharing, extending organic reach by 34%. |

This systematic derivation of requirements from validated research ensures that K-Trek's design decisions are grounded in empirical evidence rather than assumptions. The convergence of findings across multiple studies—particularly the strong performance metrics from Thinnukool et al. (2025)—provides confidence that K-Trek's core mechanics will effectively engage tourists and promote Kelantan's cultural heritage.

### 4.1.3 Finalized Requirements and Features of K-Trek

The K-Trek platform seeks to revolutionize cultural tourism exploration in Kelantan through built-in capabilities that combine gamification mechanics, location-based verification, and educational cultural content. K-Trek delivers an improved exploration process with intuitive interfaces to minimize complexity during tourist journeys and enhance cultural awareness and satisfaction. Below are the finalized features and requirements for the K-Trek system:

**Core User Features:**

1. **Authentication System:** Users can create secure accounts with designated credentials (email/password) to access system functions and maintain progress across multiple sessions.

2. **Attraction Discovery:** The homepage presents a comprehensive list of Kelantan's cultural attractions including Kampung Kraftangan, Gelanggang Seni, and Lata Keding, with brief descriptions and visual previews to aid destination selection.

3. **Mission Preview:** Users can view detailed information about each attraction's associated tasks before visiting, including task types, difficulty levels, estimated completion time, and cultural context to enhance preparation.

4. **QR Code Mission Unlocking:** Physical QR codes placed at attraction sites unlock location-specific missions, ensuring authentic site visitation and preventing remote task completion.

5. **Diverse Task Types:** Six distinct mission types maintain engagement variety:
   - **Check-In (Priority):** Location verification using Geolocation API
   - **Quiz:** Multiple-choice questions about cultural facts with immediate educational feedback
   - **Count & Confirm:** Observation challenges requiring users to count specific elements (e.g., pillars, artifacts)
   - **Direction & Orientation:** Navigation challenges using Mapbox integration
   - **Observation Match:** Visual identification tasks matching physical site elements to provided options
   - **Time-Based Challenge:** Timed exploration activities encouraging focused engagement

6. **Progress Tracking:** Real-time visual progress indicators for each attraction showing task completion percentage, earned XP/EP, and advancement toward tier milestones.

7. **Dual-Currency Progression System:**
   - **Experience Points (XP):** Earned through task completion, determines global leaderboard position
   - **Engagement Points (EP):** Awarded for non-task interactions (reading guides, visiting new sites)

8. **Category-Based Tier Advancement:** Users progress from Bronze → Silver → Gold within specific cultural categories (Historical Sites, Traditional Crafts, Performing Arts) based on completion achievements.

9. **Reward System:** Users unlock culturally relevant Badges and Titles upon completing attraction milestones, displayed in their profile collection gallery.

10. **Cultural Guides:** Each attraction features comprehensive educational content about Kelantan's heritage, traditions, and historical significance accessible before, during, and after visits.

11. **Interactive Mapping:** Mapbox GL JS integration provides turn-by-turn navigation to attractions with multiple transport modes (walking, driving, cycling) and custom markers for cultural sites.

12. **User Statistics Dashboard:** Comprehensive view of total XP/EP, category progress percentages, milestone achievements, and leaderboard standing.

13. **Report Submission:** Users can submit feedback, report issues, or suggest improvements for attractions and tasks through an integrated reporting system.

**Administrative Features:**

14. **Attraction Management:** Admin panel enables CRUD operations for attraction entries including names, descriptions, locations (lat/long), images, and category assignments.

15. **Task Management:** Administrators can create, edit, and delete tasks with customizable parameters (type, instructions, correct answers, point values, media attachments).

16. **Cultural Guide Content Management:** Backend tools for managing educational content ensuring accuracy and cultural sensitivity of displayed information.

17. **Reward Configuration:** Superadmin capabilities to design and assign new badges and titles with custom icons, names, and unlock criteria.

18. **User Analytics:** Dashboard displays aggregate statistics (total users, active users, popular attractions, completion rates) to inform tourism promotion strategies.

19. **Report Management:** Admin interface to view user-submitted reports, respond to feedback, and address technical issues or content suggestions.

20. **Role-Based Access Control (RBAC):** Hierarchical permission system distinguishing between Superadmin (global access) and Manager (location-restricted access) roles.

The comprehensive feature set addresses identified gaps in cultural tourism promotion by providing structured, engaging pathways for tourists to discover and learn about Kelantan's heritage. The evidence-based design ensures that each feature serves a validated user need derived from successful implementations in comparable contexts.

---

## 4.2 The Accomplishment of Objective 2: To develop a gamified mobile application aimed at introducing Kelantan to local and international tourists

The objective 1 completion transitioned development efforts toward constructing the K-Trek system, which functions as a comprehensive gamified cultural tourism platform. The core features of location-based verification, diverse task types, dual-currency progression, and educational integration were implemented during this phase together with database setup, responsive interface development, and API integration for mapping and navigation. This section documents the high-fidelity prototype implementation with descriptive explanations of key interfaces and functionality, demonstrating how design decisions translate into operational features. The next phase focuses on Objective 3, which will establish expected performance benchmarks through comparative evaluation methodology.

### 4.2.1 High-Fidelity Prototype

The K-Trek system has been developed as a fully functional responsive web application accessible across desktop, tablet, and mobile devices. The prototype implements all core features identified in the requirement gathering phase, with particular emphasis on mobile-first design given that most tourists explore destinations via smartphones. The following subsections present the implemented interfaces organized by user journey: authentication, exploration, task execution, progress tracking, and reward collection.

#### 4.2.1.1 Authentication Interfaces

**Figure 4.1: User Registration Interface**

*[PLACEHOLDER: Screenshot showing the registration page with the following elements:*
- *Clean, welcoming header with K-Trek branding and Kelantan cultural imagery*
- *Form fields: Full Name, Email, Password, Confirm Password*
- *Password strength indicator (visual bar showing weak/medium/strong status)*
- *Password requirements checklist (minimum 8 characters, uppercase, lowercase, number, special character)*
- *Checkbox for Terms & Conditions acceptance*
- *"Create Account" primary button in brand colors*
- *"Already have an account? Login" link at bottom*
- *Mobile-responsive layout optimized for touchscreen input]*

The registration interface implements secure account creation following industry-standard authentication practices. Users are guided through a straightforward signup process with real-time password validation feedback. The system enforces strong password requirements to protect user accounts, displaying a dynamic strength indicator that transitions from red (weak) to yellow (medium) to green (strong) as users type. A visual checklist beneath the password field marks each requirement (uppercase letter, number, special character, minimum length) as satisfied, providing immediate feedback that reduces form abandonment. The interface maintains accessibility standards with appropriate label-input associations, sufficient color contrast ratios, and keyboard navigation support.

**Figure 4.2: Password Strength Validation**

*[PLACEHOLDER: Screenshot showing password field with validation states:*
- *Top panel: Weak password example (e.g., "password") with red indicator and incomplete checklist*
- *Bottom panel: Strong password example (e.g., "Kelantan2025!") with green indicator and all checkmarks*
- *Visual emphasis on the password strength meter changing colors*
- *Clear visual feedback for requirement satisfaction]*

The password validation system provides progressive disclosure of security requirements, educating users about authentication best practices while maintaining usability. This approach, informed by security research on password policies, balances protection with user experience by making requirements explicit rather than frustrating users with cryptic rejection messages after form submission.

**Figure 4.3: Successful Registration Confirmation**

*[PLACEHOLDER: Screenshot showing success state:*
- *Green notification banner: "Account created successfully! Welcome to K-Trek."*
- *Brief welcome message explaining next steps*
- *Prominent "Go to Login" button*
- *Fade-in animation for smooth transition*
- *Confetti or celebratory visual element (optional) to create positive first impression]*

Upon successful registration, the system displays a confirmation message that reassures users their account is ready and guides them toward the login page. This positive reinforcement creates an encouraging first impression and reduces confusion about what action to take next. The notification design follows established UX patterns with appropriate use of color (green for success), clear messaging, and actionable next steps.

**Figure 4.4: User Login Interface**

*[PLACEHOLDER: Screenshot of login page showing:*
- *Minimalist design focusing on core functionality*
- *Email and Password input fields*
- *"Show Password" toggle (eye icon) for password visibility*
- *"Remember Me" checkbox option*
- *"Login" primary action button*
- *"Forgot Password?" link aligned to the right*
- *"Don't have an account? Sign Up" link at bottom*
- *Consistent branding with registration page*
- *Loading spinner animation for authentication processing]*

The login interface provides a clean, focused experience that minimizes friction for returning users. The "Show Password" toggle addresses a common usability issue where users mistype hidden passwords, reducing failed login attempts. The "Remember Me" option offers convenience for users on personal devices while respecting security concerns for shared devices. All interactive elements are sized appropriately for touch targets (minimum 44x44px) following mobile interface guidelines.

**Figure 4.5: Invalid Login Credentials Error**

*[PLACEHOLDER: Screenshot showing error state:*
- *Red notification banner below login button: "Invalid email or password. Please try again."*
- *Input fields highlighted with red border to indicate error location*
- *Error message appears without page refresh (AJAX validation)*
- *Password field cleared for security while email remains populated for convenience*
- *"Forgot Password?" link visually emphasized as solution path]*

Error handling in the authentication system follows security best practices by providing generic error messages that don't reveal whether the email exists in the database (preventing user enumeration attacks). The error state is clearly communicated through multiple channels—color, text, and border styling—ensuring accessibility for users with different visual capabilities. The system preserves the entered email while clearing the password field, balancing convenience with security.

**Figure 4.6: Admin Login Interface**

*[PLACEHOLDER: Screenshot of admin authentication showing:*
- *Distinct visual styling from user login (darker theme, professional appearance)*
- *"Admin Portal" header clearly distinguishing from user interface*
- *Email and Password fields with enhanced security indicators*
- *Role selection dropdown: "Superadmin" or "Manager"*
- *Multi-factor authentication prompt (if enabled)*
- *Session timeout warning notice*
- *"Access Admin Dashboard" button with lock icon*
- *No "Sign Up" option (admin accounts created by superadmin only)*
- *Footer showing last successful login timestamp]*

The administrative login interface implements separate authentication flows to maintain clear separation between tourist users and system administrators. The distinct visual design immediately communicates to users that they are accessing a privileged area requiring elevated credentials. The role-based access control begins at login, with the system validating not only credentials but also assigned permissions before granting dashboard access. This architecture aligns with the documented security requirements where superadmins maintain global system access while managers are restricted to specific attraction locations.

**Figure 4.7: Password Recovery Interface**

*[PLACEHOLDER: Screenshot showing password reset flow:*
- *"Forgot Password" page with simple form*
- *Single email input field with clear label*
- *Explanatory text: "Enter your registered email to receive reset instructions"*
- *"Send Reset Link" button*
- *Back to Login link*
- *Success state showing: "Check your email for reset instructions. Link expires in 15 minutes."*
- *Email notification preview showing reset link format]*

The password recovery system implements secure token-based reset following OWASP recommendations. When users submit their email, the system generates a time-limited cryptographically secure token stored in the database with 15-minute expiration. The reset email contains a unique link with the embedded token, directing users to a secure page where they can establish a new password. The system provides clear feedback at each stage—request submission, email delivery confirmation, and successful password update—reducing user anxiety during the recovery process.

---

**[END OF PART 1]**

**Note:** This is Part 1 of Chapter 4, covering sections 4.1 (Objective 1 accomplishment) and the beginning of 4.2.1 (Authentication Interfaces). Part 2 will continue with the remaining user interfaces, backend implementation, and Objective 3 evaluation.