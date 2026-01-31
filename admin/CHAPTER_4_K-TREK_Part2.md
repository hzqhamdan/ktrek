# CHAPTER 4: RESULT AND DISCUSSION - PART 2

**[CONTINUATION FROM PART 1]**

---

#### 4.2.1.2 Tourist User Interface

**Figure 4.8: Homepage - Attraction Discovery**

*[PLACEHOLDER: Screenshot of main dashboard showing:*
- *Header navigation: K-Trek logo with Kelantan cultural motif, User Profile dropdown (avatar, username), Reports icon, Logout button*
- *Welcome banner: "Selamat Datang, [User Name]! Explore Kelantan's Heritage" with background image of iconic Kelantan landmark*
- *Category filter tabs: All | Historical Sites | Religious Sites | Nature & Recreation | Traditional Crafts | Performing Arts*
- *Grid layout of attraction cards (responsive: 3 columns desktop, 2 tablet, 1 mobile):*
  - *Each card displays:*
    - *Attraction featured image with category badge overlay*
    - *Attraction name in bold heading*
    - *Location pin icon + district name (e.g., "Kota Bharu", "Jeli", "Machang")*
    - *Brief one-line tagline/description*
    - *Progress indicator: Circular progress chart showing "2/6 tasks completed (33%)"*
    - *Category tier badge: Bronze/Silver/Gold icon with label*
    - *XP reward preview: "+150 XP available" in highlighted badge*
    - *"Explore Now" CTA button with arrow icon*
  - *Hover effect: Card elevation with subtle shadow and scale transform*
- *Search bar at top: "Search attractions by name or location..." with magnifying glass icon*
- *Map toggle button: "View Map" switching to AttractionMapPage*
- *Quick stats sidebar (desktop only):*
  - *Total XP: Large number display*
  - *Current Level: Level badge with progress to next level*
  - *Attractions Visited: X/25*
  - *Tasks Completed: Running total*
  - *Active Streak: Days in a row*
- *Bottom persistent navigation (mobile):*
  - *Home icon (active state)*
  - *Map icon*
  - *Progress/Stats icon*
  - *Rewards icon*
  - *Profile icon*
- *Loading state: Skeleton cards with pulse animation while fetching data*
- *Empty state (if no attractions): Illustration with "No attractions found" message and retry button]*

The homepage serves as the central discovery hub where tourists begin their cultural exploration journey. The card-based layout implements the system documentation's responsive design philosophy, with attraction cards dynamically arranged via CSS Grid that automatically adjusts from three-column desktop layouts to single-column mobile presentations. Each card provides essential information at a glance—users can immediately assess their progress (completed tasks percentage), current achievement tier (Bronze/Silver/Gold), and potential rewards (XP preview) without navigating deeper.

The category filtering system addresses the information overload challenge identified in requirement gathering. By segmenting attractions into distinct cultural categories (Historical Sites, Religious Sites, Nature & Recreation, Traditional Crafts, Performing Arts), users can narrow their exploration focus based on personal interests. The active filter state persists across sessions via localStorage, enabling users to resume their exploration from where they left off. The search functionality implements client-side filtering with debounced input handling to provide instantaneous results without server round-trips.

The progress visualization on each card—implemented as circular progress charts using SVG—creates the "completion momentum" effect validated by Thinnukool et al. (2025) research. Users seeing "2/6 tasks completed" experience psychological motivation to complete remaining tasks, transforming the homepage from a passive directory into an active progress dashboard. The tier badges (Bronze/Silver/Gold) displayed on cards reflect the user's category-specific advancement, providing social proof and achievement status at a glance.

**Figure 4.9: Attraction Detail Page - Bank Kerapu**

*[PLACEHOLDER: Screenshot showing comprehensive attraction information:*
- *Header bar:*
  - *K-Trek logo centered at top*
  - *Profile avatar icon (left)*
  - *Notification bell icon (right)*
  - *Back button with arrow and "Back" text (below header)*
- *Hero image section:*
  - *Full-width attraction photo (Bank Kerapu building exterior)*
  - *Clean image display without carousel navigation (single primary image)*
  - *Image fills width with rounded bottom corners*
- *Attraction information panel (beige/cream background):*
  - *Attraction name: "Bank Kerapu" (large serif heading font)*
  - *Location with pin icon: "📍 Kota Bharu"*
  - *Brief description: "A historical building used during World War II and now serves as a museum documenting Kelantan's wartime history."*
  - *Three-column statistics display:*
    - *Column 1: Clock icon + "3" + "Tasks"*
    - *Column 2: Trophy/medal icon + "3" + "Completed"*
    - *Column 3: People icon + "100%" + "Progress"*
  - *Clean, minimal design with icons above numbers*
- *Action buttons (white background, rounded):*
  - *"Start Next Mission" primary button (prominent, full-width)*
  - *"Navigate in Google Maps" secondary button with navigation arrow icon*
- *Available Missions section:*
  - *Section header: "Available Missions" (serif font, left-aligned)*
  - *Completion indicator: "2 of 3 completed" (small text, right-aligned)*
  - *Mission cards in vertical list:*
    - *Card 1: QUIZ - "World War II History Quiz"*
      - *Status: "Completed" (green text, right-aligned)*
      - *Description: "Learn about the history of Bank Kerapu."*
    - *Card 2: CHECKIN - "War Museum Check-in"*
      - *Status: "Completed" (green text)*
      - *Description: "Confirm your visit to Bank Kerapu."*
    - *Card 3: OBSERVATION_MATCH - "Match the Historical Artifacts"*
      - *Status: "Not completed" (gray text)*
      - *Description: "Observe the museum exhibits and match each artifact with its historical function."*
  - *Each card shows:*
    - *Mission type label in uppercase (small text)*
    - *Mission title (medium-large font)*
    - *Brief description (smaller font)*
    - *Status indicator (color-coded: green for completed, gray for not completed)*
  - *No explicit difficulty ratings or point displays shown*
  - *Simple, clean card design with subtle borders*
- *Bottom navigation bar (sticky):*
  - *5 icons evenly spaced:*
    - *Home icon*
    - *Location/map pin icon*
    - *Bar chart/stats icon*
    - *Gift/rewards icon*
    - *Document/list icon*
  - *Navigation bar in beige/cream color matching theme*
- *Design characteristics:*
  - *Warm color palette (beige, cream, white backgrounds)*
  - *Serif fonts for headings (elegant, cultural aesthetic)*
  - *Sans-serif for body text*
  - *Minimalist, clean interface*
  - *No tabs navigation (single scrollable page)*
  - *Progress shown inline with mission list*
  - *No carousel or image gallery (single hero image)*
  - *Completion status integrated into mission cards*
  - *Focus on simplicity and clarity*]*

The attraction detail page consolidates all information tourists need to explore and engage with cultural sites. The clean, minimalist design prioritizes essential information without overwhelming users with complex navigation structures. The single-page scrollable layout eliminates the need for tab switching, allowing users to consume all attraction information—hero image, description, statistics, and available missions—through natural scrolling behavior familiar from modern mobile applications.

The statistics panel with three-column layout provides at-a-glance progress assessment. The clock icon representing total tasks (3), trophy icon showing completed count (3), and people icon displaying completion percentage (100%) create immediate visual comprehension without requiring text reading. This icon-driven design transcends language barriers, supporting K-Trek's potential for international tourist usage. The 100% completion status triggers psychological satisfaction through achievement recognition, implementing the completion feedback loops validated in gamification research.

The mission cards implement a simplified status system with clear visual hierarchy. Completed missions display green "Completed" text providing positive reinforcement, while incomplete missions show gray "Not completed" maintaining neutral tone that avoids negative framing. The mission type labels (QUIZ, CHECKIN, OBSERVATION_MATCH) in uppercase provide categorical clarity, while the descriptive titles and explanatory text ensure users understand task expectations before engagement. This transparency addresses the Thinnukool et al. (2025) finding that clear mission instructions achieved 91% completion rates compared to 68% for ambiguous tasks.

The dual action buttons implement prioritized navigation patterns. "Start Next Mission" as the primary button uses prominent styling guiding users toward immediate engagement, while "Navigate in Google Maps" as secondary button provides wayfinding assistance without competing for primary attention. The Google Maps integration acknowledges that most tourists already have Google Maps installed, leveraging existing familiarity rather than requiring adaptation to new navigation interfaces. This pragmatic design decision reduces friction in the user journey from attraction discovery to physical visitation.

The bottom navigation bar with five icons (Home, Map, Stats, Rewards, Profile) provides persistent access to core application functions following mobile design best practices. The sticky positioning ensures navigation remains accessible regardless of scroll depth, preventing users from needing to scroll back to top for navigation changes. The icon-only approach maximizes screen real estate for content while maintaining recognizability through universal iconography (house for home, pin for map, chart for statistics, gift for rewards, document for profile).

The warm color palette (beige, cream, white) with serif heading typography creates cultural aesthetic alignment with Kelantan's heritage context. This design decision differentiates K-Trek from generic blue-and-white tourism applications, establishing visual identity that reinforces the application's cultural preservation mission. The serif fonts evoke traditional, historical associations appropriate for heritage tourism, while sans-serif body text maintains readability for longer descriptions.

**Figure 4.10: QR Code Scanning Interface**

*[PLACEHOLDER: Screenshot of QR scanner showing:*
- *Full-screen camera viewfinder occupying 80% of screen*
- *Semi-transparent overlay with cutout showing scan area*
- *Animated corner brackets (L-shaped) at four corners of scan area, pulsing to indicate active scanning*
- *Header bar at top with back button (X icon) and instructions*
- *Instruction text: "Scan the QR code at [Attraction Name] to unlock missions"*
- *Subtext: "Position the QR code within the frame"*
- *Flash toggle button (lightning bolt icon) in top-right corner for low-light conditions*
- *Manual entry link at bottom: "Can't scan? Enter code manually" opening input modal*
- *Permission prompt (if first use): "K-Trek needs camera access to scan QR codes" with Allow/Deny buttons*
- *Success state animation:*
  - *Green checkmark explosion animation in center*
  - *Confetti particles falling*
  - *Success message overlay: "Location Verified! ✓"*
  - *Attraction name confirmation: "You're at Kampung Kraftangan"*
  - *Reward notification: "+20 XP, +10 EP earned for Check-In"*
  - *Automatic redirect countdown: "Redirecting to missions in 3... 2... 1..."*
  - *Or immediate "View Missions" button for user control*
- *Error states:*
  - *Invalid code: Red shake animation + "Invalid QR code. Please scan the official K-Trek code for this location."*
  - *Wrong location: Orange warning + "This QR code is for [Other Attraction]. Please scan the code at [Current Attraction]."*
  - *Already scanned: Blue info message + "You've already checked in here today! Your progress is saved."*
  - *Network error: Red alert + "Connection issue. Retry" button + "Your scan will sync when back online"*
  - *Each error shows "Retry" button to re-activate camera*
- *Loading state during verification: Spinner overlay + "Verifying location..."*
- *Offline mode indicator: "Operating offline - scan will sync later" in yellow banner*
- *Tips section (collapsible): "For best results: Hold phone steady, ensure good lighting, keep QR code flat"*]*

The QR code scanning functionality implements the HTML5-QRCode library as documented in the system architecture, enabling browser-based camera access without requiring native app permissions beyond standard web API prompts. The interface uses the MediaDevices API (`navigator.mediaDevices.getUserMedia()`) to access device cameras with user consent, displaying a clear permission rationale ("K-Trek needs camera access to scan QR codes") that improves grant rates by explaining value rather than demanding access.

The visual design of the scanner creates an intuitive scanning experience through the animated corner brackets that provide continuous feedback—the pulsing animation communicates that the system is actively processing camera feed rather than frozen or crashed. The semi-transparent overlay with a clear cutout frame (typically 70% of screen width, square aspect ratio) directs user attention to the scan area while dimming peripheral visual noise, improving QR code detection accuracy. The system uses the `Html5QrcodeScanner` configuration with `fps: 10, qrbox: 250` parameters to balance detection speed with battery efficiency, as documented in the implementation.

The manual entry fallback ("Can't scan? Enter code manually") addresses accessibility and edge cases where camera functionality is unavailable—devices with broken cameras, users with visual impairments using screen readers, or situations where QR codes are damaged or obscured. The manual entry modal accepts the same format as QR payload (attraction ID concatenated with unique code), performing identical backend verification. This redundancy ensures that technical limitations never completely block user progression, aligning with inclusive design principles.

The success state delivers multiple layers of positive reinforcement: immediate visual feedback (green checkmark animation), reward notification (XP/EP earned), and progress confirmation ("missions unlocked"). The confetti animation—implemented using CSS animations with particle physics calculations—creates a celebration moment that psychologically reinforces the desired behavior (visiting physical locations). The automatic redirect with countdown provides users with control (they can manually navigate if they want to read rewards more carefully) while defaulting to efficient progression for users who prefer seamless flow.

Error handling implements defensive UX design by distinguishing between error types and providing actionable solutions. An invalid code suggests scanning the official QR code, implying the user may have scanned something unrelated. A wrong location error explicitly names both the scanned location and expected location, helping users understand spatial context. The "already scanned today" message prevents duplicate check-ins while reassuring users their progress is saved—the phrase "today" implements the daily check-in limit documented in the backend business logic. Network errors activate the offline queue mechanism, storing scan data locally (IndexedDB) for later synchronization.

**Figure 4.11: Mission Execution - Quiz Task Interface**

*[PLACEHOLDER: Screenshot showing quiz task:*
- *Header section (top bar):*
  - *Back button (left) with arrow and "Back" text*
  - *Profile avatar icon (right)*
- *Progress card (white card with shadow):*
  - *Brain/quiz icon (left side)*
  - *Text: "Question 1 of 3" with orange progress line underneath*
  - *Timer icon and countdown: "0:06" (top right)*
  - *Clean, minimal design*
- *Question card (large white card):*
  - *Question text (serif font, large):*
    - *"What material is mainly used in Kampung Laut Old Mosque?"*
  - *Answer options (4 buttons stacked vertically):*
    - *Option 1: "Concrete" - Red background with X icon (incorrect selection)*
    - *Option 2: "Wood" - Green background with "Correct Answer" text and checkmark icon*
    - *Option 3: "Steel" - Gray/neutral (not selected)*
    - *Option 4: "Brick" - Gray/neutral (not selected)*
  - *Visual feedback:*
    - *User's wrong answer highlighted in red/pink with X icon*
    - *Correct answer highlighted in green with checkmark icon*
    - *Unselected options remain gray/neutral*
- *Feedback message card (below question):*
  - *Error icon (red circle with X)*
  - *Message text (red/brown color):*
    - *"Incorrect. The correct answer is highlighted above."*
  - *Score indicator: Circular "1" badge (shows points earned or questions wrong)*
  - *Simple, direct feedback without extensive explanation*
- *Navigation controls (bottom):*
  - *"Previous" button (left, gray)*
  - *Progress text: "1 / 3 answered" (center)*
  - *"Next" button (right, gray)*
  - *Buttons enable navigation between questions*
- *Bottom navigation bar:*
  - *5 icons: Home, Map, Stats, Rewards, Profile*
- *Design characteristics:*
  - *Clean card-based layout*
  - *Color-coded feedback (red = wrong, green = correct)*
  - *Minimal text - direct and clear*
  - *No lengthy educational explanations after each question*
  - *Timer creates light time pressure*
  - *Progress tracking shows completion status*
  - *Simple error messaging*]*

The quiz task interface embodies K-Trek's approach to cultural knowledge assessment through clean, streamlined interactions. The question presentation follows cognitive load theory by displaying one question at a time with minimal visual clutter—the question text, four answer options, and feedback card comprise the entire interface, avoiding information overload. The progress indicator ("Question 1 of 3") creates a sense of achievable completion—users know exactly how many questions remain, managing expectations and maintaining motivation. Research in gamification shows that visible progress significantly reduces task abandonment rates.

The answer option design uses generous vertical spacing with full-width buttons ensuring easy tap targets on mobile devices. The clean card-based layout with sufficient padding between options prevents accidental mis-selections, particularly important for touchscreen interfaces. Each option uses simple text labels without additional icons or decorative elements during the selection phase, maintaining focus on content rather than interface chrome. The neutral gray color for unselected options creates visual hierarchy that draws attention to the selected and correct answers after submission.

The feedback mechanism implements immediate visual communication through color psychology: red/pink for incorrect selections and green for correct answers. The dual-highlighting approach—marking both the user's wrong answer (red with X icon) and the correct answer (green with checkmark icon)—provides complete information at a glance. Users instantly understand what they chose (incorrect) and what they should have chosen (correct) without reading explanatory text. This visual-first feedback design accommodates quick comprehension, particularly valuable for users with limited reading proficiency or those operating in their non-native language.

The feedback message card delivers concise, direct communication: "Incorrect. The correct answer is highlighted above." This minimalist messaging focuses on guiding users to the visual feedback rather than providing verbose explanations. The approach prioritizes efficiency—users can quickly see their mistake, identify the correct answer, and move to the next question without delays. The circular score indicator showing "1" (representing questions wrong or points earned) provides numerical feedback complementing the visual answer highlights.

The absence of comprehensive cultural explanations after each question represents a design philosophy prioritizing flow and momentum over deep educational content within the quiz itself. This approach acknowledges that lengthy explanations disrupt engagement rhythm—users motivated by game mechanics want to maintain forward progress rather than pause for extended reading. The system defers educational depth to the dedicated Cultural Guide sections accessible from attraction pages, where users seeking comprehensive knowledge can engage with content at their own pace without time pressure or task completion urgency.

The timer display ("0:06" elapsed) adds light time pressure creating engagement tension without harsh constraints. Unlike time-based challenges with strict deadlines, the quiz timer tracks duration without penalizing slow responses, enabling performance tracking (fastest completion times could feed leaderboards) while maintaining accessibility for users who need more deliberation time. The timer's subtle presence (small text in header card) maintains awareness without creating anxiety-inducing countdown urgency.

The navigation controls ("Previous" / "Next" buttons with "1 / 3 answered" progress) implement flexible question flow. Users can review previous questions, change answers before final submission (if the quiz allows), and control pacing rather than being forced through linear progression. This navigation agency respects different user preferences—some users prefer answering all questions before submission, others prefer question-by-question confirmation. The progress text ("1 / 3 answered") reinforces completion status with each interaction.

**Figure 4.11A: Check-In Method Selection**

*[PLACEHOLDER: Screenshot showing check-in method choice:*
- *Header bar:*
  - *K-Trek logo centered*
  - *Profile avatar (left)*
  - *Notification icon (right)*
  - *Back button below header*
- *Main content card (centered, white background with shadow):*
  - *Icon section:*
    - *Large orange location pin icon on peach/beige circular background*
    - *Centered at top of card*
  - *Heading text (serif font):*
    - *"How would you like to check in?"*
    - *Large, centered, black text*
  - *Subheading text:*
    - *"Choose one method to verify you're at this attraction."*
    - *Gray text, centered*
    - *"this attraction" in bold*
  - *Method option buttons (two large white buttons with icons):*
    - *Button 1: "Scan QR Code"*
      - *QR code icon (left side)*
      - *Text label (right side)*
      - *White background, rounded corners*
      - *Full-width within card*
    - *Button 2: "Use Live Location"*
      - *Location pin icon (left side)*
      - *Text label (right side)*
      - *White background, rounded corners*
      - *Full-width within card*
      - *Vertical spacing between buttons*
  - *Tip section (bottom of card):*
    - *Small gray text: "Tip: For best accuracy, enable GPS and try outdoors."*
    - *Helpful guidance for GPS method*
- *Bottom navigation bar:*
  - *5 icons: Home, Map, Stats, Rewards, Profile*
  - *Beige/cream background*
- *Design characteristics:*
  - *Clean, minimal interface*
  - *Warm color palette (beige/cream/white)*
  - *Large tappable buttons for easy selection*
  - *Clear visual hierarchy with icon → heading → options flow*
  - *Friendly, instructional tone*
  - *Generous white space*]*

The Check-In method selection screen implements a critical decision point where users choose their preferred verification approach. The dual-method offering addresses different user contexts and preferences: QR code scanning works reliably indoors and in areas with poor GPS signal, while live location verification enables check-in without requiring users to locate physical QR codes. This flexibility ensures that technical limitations or situational constraints don't prevent task completion, implementing the accessibility principles documented in requirement gathering.

The visual hierarchy guides attention flow through deliberate sizing and positioning. The large orange location pin icon immediately establishes the page's purpose (location verification) through universal iconography. The centered placement and generous sizing (occupying roughly 20% of card height) creates visual anchor that users process before reading text. The peach circular background provides color contrast while maintaining cohesion with K-Trek's warm color palette, drawing eyes to the icon through chromatic differentiation.

The question-format heading ("How would you like to check in?") frames the interaction as user choice rather than system requirement, implementing agency-oriented design that research shows increases user satisfaction. The phrasing "would you like" creates conversational tone suggesting preference accommodation rather than rigid constraint. The explanatory subtext ("Choose one method to verify you're at this attraction") provides rationale transparency—users understand *why* they're making this choice (verification of physical presence) rather than facing unexplained options.

The button design prioritizes tappability and clarity. The icons (QR code grid pattern, location pin) provide visual recognition enabling rapid option differentiation without reading text labels. The left-aligned icon with right-aligned text creates balanced composition while leaving generous tap area. The white buttons against the card's subtle background create sufficient contrast for visual distinction while maintaining the gentle, approachable aesthetic. The vertical stacking with spacing prevents accidental mis-taps, particularly important for users with large fingers or motor control challenges.

The tip section implements proactive problem-solving by addressing common GPS accuracy issues before they cause frustration. The guidance "enable GPS and try outdoors" educates users about GPS requirements, reducing support requests and check-in failures from weak GPS signals. The casual "Tip:" prefix frames this as helpful suggestion rather than stern warning, maintaining the friendly tone. The placement at card bottom ensures users read the options before encountering the tip, preventing information overload at the critical decision moment.

**Figure 4.12: Check-In Task - QR Code Scanning Method**

*[PLACEHOLDER: Screenshot showing QR code scanner interface:*
- *Full-screen camera viewfinder occupying 80% of screen*
- *Semi-transparent overlay with cutout showing scan area*
- *Animated corner brackets (L-shaped) at four corners of scan area, pulsing to indicate active scanning*
- *Header bar at top with back button (X icon) and instructions*
- *Instruction text: "Scan the QR code at [Attraction Name] to unlock missions"*
- *Subtext: "Position the QR code within the frame"*
- *Flash toggle button (lightning bolt icon) in top-right corner for low-light conditions*
- *Manual entry link at bottom: "Can't scan? Enter code manually" opening input modal*
- *Permission prompt (if first use): "K-Trek needs camera access to scan QR codes" with Allow/Deny buttons*
- *Success state animation:*
  - *Green checkmark explosion animation in center*
  - *Confetti particles falling*
  - *Success message overlay: "Location Verified! ✓"*
  - *Attraction name confirmation: "You're at [Attraction Name]"*
  - *Reward notification: "+20 XP, +10 EP earned for Check-In"*
  - *Automatic redirect countdown: "Redirecting to missions in 3... 2... 1..."*
  - *Or immediate "View Missions" button for user control*
- *Error states:*
  - *Invalid code: Red shake animation + "Invalid QR code. Please scan the official K-Trek code for this location."*
  - *Wrong location: Orange warning + "This QR code is for [Other Attraction]. Please scan the code at [Current Attraction]."*
  - *Already scanned: Blue info message + "You've already checked in here today! Your progress is saved."*
  - *Network error: Red alert + "Connection issue. Retry" button + "Your scan will sync when back online"*
  - *Each error shows "Retry" button to re-activate camera*
- *Loading state during verification: Spinner overlay + "Verifying location..."*
- *Offline mode indicator: "Operating offline - scan will sync later" in yellow banner*
- *Tips section (collapsible): "For best results: Hold phone steady, ensure good lighting, keep QR code flat"*]*

The QR code scanning method implements the HTML5-QRCode library as documented in the system architecture, enabling browser-based camera access without requiring native app permissions beyond standard web API prompts. The interface uses the MediaDevices API (`navigator.mediaDevices.getUserMedia()`) to access device cameras with user consent, displaying a clear permission rationale that improves grant rates by explaining value rather than demanding access.

The visual design creates an intuitive scanning experience through the animated corner brackets that provide continuous feedback—the pulsing animation communicates that the system is actively processing camera feed rather than frozen or crashed. The semi-transparent overlay with a clear cutout frame (typically 70% of screen width, square aspect ratio) directs user attention to the scan area while dimming peripheral visual noise, improving QR code detection accuracy. The system uses the `Html5QrcodeScanner` configuration with `fps: 10, qrbox: 250` parameters to balance detection speed with battery efficiency.

The manual entry fallback addresses accessibility and edge cases where camera functionality is unavailable—devices with broken cameras, users with visual impairments using screen readers, or situations where QR codes are damaged or obscured. The manual entry modal accepts the same format as QR payload, performing identical backend verification. This redundancy ensures that technical limitations never completely block user progression.

The success state delivers multiple layers of positive reinforcement: immediate visual feedback (green checkmark animation), reward notification (XP/EP earned), and progress confirmation (missions unlocked). The confetti animation creates a celebration moment that psychologically reinforces the desired behavior of visiting physical locations. The automatic redirect with countdown provides users control while defaulting to efficient progression.

**Figure 4.13: Check-In Task - Live Location Verification Method**

*[PLACEHOLDER: Screenshot showing live location check-in interface:*
- *Header section:*
  - *Mission type badge: "Check-In" with location pin icon (green color scheme)*
  - *Mission title: "Verify Your Presence"*
  - *Subtitle: "Priority Mission - Complete this first to unlock other tasks"*
- *Map preview section:*
  - *Embedded mini-map showing user's current location and attraction location*
  - *User location: Blue pulsing dot with accuracy circle*
  - *Attraction location: Red marker pin with attraction icon*
  - *Polyline connecting user to attraction if within 1km*
  - *"View Full Map" button opening expanded Mapbox view*
- *Distance indicator (prominent display):*
  - *Large distance readout: "You are 15 meters from the check-in point"*
  - *Color-coded based on proximity:*
    - *Green: Within 50m (check-in possible)*
    - *Yellow: 50-100m (getting close)*
    - *Orange: 100-500m (walking distance)*
    - *Red: >500m (too far)*
  - *Walking direction arrow: "Walk northeast" with compass indicator*
  - *Updated in real-time as user moves*
- *GPS accuracy indicator:*
  - *"GPS Accuracy: ±8 meters" with signal strength bars*
  - *Icon indicating GPS quality: Strong / Moderate / Weak*
  - *Tip if weak: "Move to an open area for better GPS signal"*
- *Instructions panel:*
  - *"You must be within 50 meters of [Attraction Name] to check in"*
  - *"Make sure location services are enabled"*
  - *Icon list of verification requirements:*
    - *✓ Location services enabled*
    - *✓ Within proximity radius*
    - *✓ At correct attraction*
    - *✗ Network connection (if offline, shows sync note)*
- *Check-in button (primary action):*
  - *Large prominent button: "Check In Now" with location pin icon*
  - *Button state based on distance:*
    - *Enabled (green): Within 50m radius*
    - *Disabled (grey): Outside radius with reason "Move closer to check in"*
  - *Loading spinner on click: "Verifying location..."*
- *Success state (after successful check-in):*
  - *Full-screen celebration animation:*
    - *Green checkmark with expanding circle ripple*
    - *Confetti burst animation*
    - *Success sound effect (if audio enabled)*
  - *Success message overlay:*
    - *"Check-in Successful! ✓"*
    - *Timestamp: "Checked in at 2:34 PM, Jan 25, 2026"*
    - *Location confirmation: "[Attraction Name], [Location]"*
  - *Rewards display:*
    - *"+20 XP, +10 EP" with animated count-up*
    - *"First Check-in Bonus: +5 XP" (if first ever check-in)*
    - *"Daily Check-in Bonus: +5 EP" (if daily streak)*
    - *Badge unlock notification (if milestone reached): "New Badge: 'First Steps' unlocked!"*
  - *Unlock notification:*
    - *"5 new missions unlocked at this location!"*
    - *Preview cards of newly unlocked missions with "Start Now" buttons*
  - *Action buttons:*
    - *"View Available Missions" primary button*
    - *"Explore More Attractions" secondary button*
- *Error states:*
  - *Too far from location:*
    - *Orange warning icon*
    - *Message: "You're 150 meters from the check-in point. Please move closer to [Attraction Name]."*
    - *Map showing route to correct location with walking directions*
    - *"Get Directions" button launching Mapbox navigation*
    - *"Retry Check-In" button (re-checks GPS location)*
  - *GPS unavailable:*
    - *Red alert icon*
    - *"Location services unavailable. Please enable location permissions for K-Trek."*
    - *"Enable Location" button (opens device settings if possible)*
    - *Alternative option: "Use QR Check-In Instead" (switches to QR method)*
  - *Already checked in:*
    - *Blue info icon*
    - *"You've already checked in here today! Your progress is saved."*
    - *Show previous check-in details: "Last check-in: 10:15 AM"*
    - *Note: "You can check in again tomorrow for bonus points"*
    - *"View My Missions" button*
  - *Network error (offline):*
    - *Yellow warning*
    - *"No internet connection. Check-in will be saved and verified when back online."*
    - *Local storage indicator: "Stored offline" with sync icon*
    - *"Continue Offline" button*
- *Helper information:*
  - *FAQ accordion:*
    - *"Why can't I check in?" → Distance/GPS troubleshooting*
    - *"How accurate is GPS?" → Explanation of ±5-50m variance*
    - *"Can I check in multiple times?" → Daily limit policy*
  - *Tips section:*
    - *"For best results, stand in an open area"*
    - *"GPS works better outdoors than indoors"*
    - *"It may take 10-30 seconds for accurate location"*
- *Accessibility features:*
  - *Voice announcement: "You are 15 meters from check-in point"*
  - *Haptic feedback on successful check-in (mobile)*
  - *High contrast mode for visual impairments]*

The live location verification method uses the browser's Geolocation API to determine user coordinates, comparing them against the attraction's stored latitude/longitude with a 50-meter tolerance radius. This method is particularly valuable for attractions without physical QR code infrastructure or situations where QR codes are temporarily unavailable (damaged, removed for maintenance, obscured by crowds).

The real-time distance indicator creates a feedback loop that guides users toward successful check-in. As users move, the distance updates dynamically (polling GPS every 3-5 seconds), with the color-coded display providing at-a-glance status: green (ready to check in), yellow (almost there), orange (walking distance), red (too far). The directional hint ("Walk northeast") uses compass calculations to transform GPS coordinates into intuitive navigation instructions.

The GPS accuracy indicator manages user expectations about location precision. By displaying "±8 meters" accuracy, the interface communicates that perfect pinpoint accuracy isn't possible with consumer GPS technology, preemptively addressing user confusion about why check-in might fail when they believe they're at the correct location. The signal strength visualization provides actionable feedback—users seeing "Weak" signal understand they may need to move to an open area.

The error handling demonstrates defensive design by distinguishing between different failure scenarios and providing specific solutions. The "too far" error displays the exact distance and suggests walking closer, with the added affordance of "Get Directions" launching turn-by-turn navigation. The GPS unavailable error recognizes that location services might be disabled, attempting to deep-link to device settings while offering the QR fallback to prevent complete blockage.

The offline mode handling addresses connectivity challenges in rural attractions. When network is unavailable, the system stores check-in data locally (using IndexedDB) with a visual "sync pending" indicator. This enables users to continue exploration without internet dependency, with automatic synchronization once connectivity resumes.

**Figure 4.14: Mission Execution - Observation Match Task**

*[PLACEHOLDER: Screenshot showing observation task:*
- *Header section:*
  - *Mission type badge: "Observation Match" with eye icon (purple color scheme)*
  - *Mission title: "Identify Traditional Patterns"*
  - *Difficulty indicator: ⚫⚫⚪ (Medium difficulty)*
- *Instructions panel:*
  - *Clear objective: "Find and identify the traditional Kelantan batik pattern shown below"*
  - *Additional context: "Look around the attraction for this pattern on displays, crafts, or decorative elements"*
  - *Tip icon with hint: "This pattern is commonly found on traditional textiles"*
- *Reference image display:*
  - *Large, clear image showing target pattern to identify*
  - *Example: Traditional bunga tanjung (jasmine flower) motif*
  - *Image zoom functionality: Pinch to zoom or click to enlarge*
  - *Image caption: "Bunga Tanjung Pattern - Symbol of Purity"*
- *Matching interface (multiple choice variant):*
  - *Section heading: "Which pattern matches the reference above?"*
  - *Four image options in 2x2 grid:*
    - *Option A: Image of similar but different pattern (bunga cina)*
    - *Option B: Image of matching pattern (bunga tanjung) ✓*
    - *Option C: Image of geometric pattern (different style)*
    - *Option D: Image of floral pattern (different flowers)*
  - *Each option card:*
    - *Image thumbnail (square, uniform size)*
    - *Radio button selection indicator*
    - *Option label: "Pattern A", "Pattern B", etc.*
    - *Tappable entire card area*
    - *Selected state: Border highlight in accent color*
  - *High-quality images with equal dimensions for fair comparison*
- *Alternative interface (photo capture variant - if implemented):*
  - *"Capture What You See" button with camera icon*
  - *Opens camera interface to photograph real pattern*
  - *Image preview after capture with "Use This Photo" or "Retake" options*
  - *AI-powered pattern recognition validates match (backend processing)*
  - *Match confidence indicator: "95% Match!" or "Pattern doesn't match - Try again"*
- *Submit button:*
  - *"Submit My Answer" primary button (enabled after selection)*
  - *"Need Help?" button revealing hint without penalty*
- *Feedback panel (after submission):*
  - *Correct match scenario:*
    - *Green success banner with checkmark*
    - *Celebratory message: "Perfect Match! You've correctly identified the bunga tanjung pattern."*
    - *Educational explanation card:*
      - *"The bunga tanjung (jasmine flower) motif is one of the most cherished patterns in traditional Kelantan batik. This pattern symbolizes purity and natural beauty in Malay culture."*
      - *Additional details about pattern history, creation technique, cultural significance*
      - *"Where to See More" section: "This pattern is commonly found on songket fabrics and traditional wedding attire"*
    - *Visual comparison: Side-by-side of reference and selected image with matching elements highlighted*
    - *Points earned: "+40 XP, +15 EP" with trophy animation*
    - *Badge potential: "Traditional Arts Expert +5 progress"*
    - *"Continue" button to next task*
  - *Incorrect match scenario:*
    - *Yellow "Try Again" banner (not harsh red, encouraging tone)*
    - *Constructive message: "That's not quite right. Take another look at the reference pattern."*
    - *Highlighted differences: Overlay showing where selected pattern differs from reference*
    - *Hint provided: "Look closely at the petal arrangement and stem curvature"*
    - *Partial credit: "+15 XP" (participation reward)*
    - *"Try Again" button (allows retry) or "Skip Task" (moves on with reduced rewards)*
    - *Still provides educational content about correct pattern*
- *Image gallery section (if implemented):*
  - *"Pattern Gallery" expandable section*
  - *Showcase of various traditional Kelantan patterns with names:*
    - *Bunga tanjung (jasmine)*
    - *Bunga cina (Chinese flower)*
    - *Bunga pecah lapan (eight-pointed flower)*
    - *Geometric patterns (Islamic geometry)*
  - *Each with brief description*
  - *"Learn More in Cultural Guide" link*
- *Progress tracking:*
  - *"1 of 3 Observation Tasks" at attraction*
  - *Category progress: "Traditional Crafts: 52% → 58%"*
- *Accessibility features:*
  - *Alt text for all pattern images*
  - *Pattern descriptions for screen readers*
  - *High contrast mode for visual comparison*
  - *Option to increase image size*
- *Helper tools:*
  - *Image comparison slider (swipe to compare reference with selection)*
  - *Zoom controls for detailed examination*
  - *Pattern detail callouts (highlighting specific features)*]*

The Observation Match task type transforms passive sightseeing into active cultural engagement by directing tourist attention to specific artistic and architectural elements they might otherwise overlook. This task variant directly addresses research findings that gamified challenges increase heritage site engagement by converting observation into participation. By requiring users to identify specific traditional patterns—batik motifs, architectural details, cultural symbols—the system fosters deeper appreciation and understanding of Kelantan's artistic traditions beyond surface-level photography.

The reference image serves as an educational anchor, introducing users to traditional Kelantanese art forms with clear visual examples before challenging them to find matching instances in the physical environment. The implementation uses high-resolution images (minimum 1024px width) ensuring pattern details are clearly visible even on small mobile screens. The zoom functionality (pinch-to-zoom gesture on touch devices, click-to-enlarge on desktop) enables detailed examination, particularly important for intricate patterns like traditional batik where subtle differences in petal arrangement or stem curvature distinguish different motifs.

The multiple-choice matching interface provides structured identification practice with controlled difficulty. By presenting four similar patterns, the task challenges users to notice specific distinguishing features rather than merely recognizing "floral" versus "geometric" categories. The option images are intentionally similar (all featuring floral motifs, for example) to require careful observation, but not so similar as to be indistinguishable—the difficulty calibration aims for moderate challenge that engages without frustrating, aligned with Flow Theory principles in gamification where optimal engagement occurs when challenge matches skill level.

The educational payoff manifests in the explanation card displayed after submission. Rather than simply indicating correct/incorrect, the system provides comprehensive cultural context: what the pattern symbolizes (bunga tanjung represents purity), where it appears (songket fabrics, wedding attire), and why it matters in Kelantanese culture. This information delivery at the moment of highest engagement—right after completing the challenge—maximizes knowledge retention compared to passive guide reading. Users who actively identified a pattern are psychologically primed to absorb and remember information about that pattern, implementing the learning science principle of active recall improving retention.

The incorrect answer handling implements growth mindset messaging by avoiding negative framing. Instead of "Wrong!" the system says "That's not quite right. Take another look..." with constructive guidance highlighting specific differences between selected and correct patterns. The visual comparison overlay (showing where patterns diverge) transforms mistakes into learning opportunities by explicitly teaching pattern recognition skills. The retry option without harsh penalty encourages persistence and continued learning rather than discouragement and task abandonment.

The pattern gallery extension serves multiple purposes: it provides a comprehensive reference for pattern types beyond the immediate task, it contextualizes the task pattern within the broader Kelantanese artistic tradition, and it creates opportunities for self-directed learning for engaged users who want to explore further. The gallery complements the forced-choice quiz format by enabling open exploration, catering to different learning styles (structured learners prefer the quiz, exploratory learners prefer the gallery).

**Figure 4.15: Mission Execution - Count & Confirm Task**

*[PLACEHOLDER: Screenshot showing counting task:*
- *Header section:*
  - *Mission type badge: "Count & Confirm" with calculator icon (teal color scheme)*
  - *Mission title: "Traditional Architectural Elements"*
  - *Difficulty indicator: ⚫⚫⚫ (Hard difficulty - requires careful observation)*
- *Task introduction:*
  - *Clear counting objective: "How many traditional wooden pillars support the main structure?"*
  - *Context explanation: "These pillars represent traditional Malay house construction techniques"*
  - *Visual helper: Annotated reference image showing example of what to count with arrows/labels*
  - *Zoom-able reference photo highlighting the architectural element*
- *Counting interface:*
  - *Large number input section (center of screen):*
    - *Current count display: "8" (user's entered number)*
    - *Number shown in large font (48px+) for clear visibility*
  - *Input controls (optimized for mobile):*
    - *Stepper buttons:*
      - *"−" button (decrement) on left*
      - *"+" button (increment) on right*
      - *Large touch targets (60px × 60px minimum)*
      - *Buttons styled as circular or rounded squares*
      - *Haptic feedback on tap (if device supports)*
    - *Alternative: Number input field (keyboard entry)*
      - *Type="number" with min="0" max="999"*
      - *Input automatically focused for quick entry*
    - *"Reset" button to clear count and start over*
  - *Running total visible as user counts*
- *Confirmation checklist:*
  - *Checkbox: "I have carefully counted all visible [elements]"*
  - *Required to be checked before submission*
  - *Ensures deliberate counting rather than random guessing*
- *Helper tools:*
  - *"Counting Tips" expandable section:*
    - *"Count from left to right systematically"*
    - *"Mark mentally as you count to avoid recounting"*
    - *"Include partially visible elements if more than 50% is shown"*
    - *"Don't include decorative replicas or images, only actual structures"*
  - *"View Guide Photo" button revealing annotated image showing area to count within*
  - *"Need Help?" button offering hint (reveals approximate range: "Between 6-10")*
- *Submit button:*
  - *"Submit Count" primary button*
  - *Disabled until count entered and checkbox confirmed*
  - *Shows loading spinner during verification*
- *Feedback states:*
  - *Exact match (correct answer):*
    - *Large green checkmark with success animation*
    - *Triumphant message: "Perfect! There are exactly 8 traditional pillars."*
    - *Educational explanation:*
      - *"These pillars demonstrate traditional Malay construction wisdom. They elevate the structure for ventilation and flood protection while distributing weight evenly."*
      - *Historical context about tiang seri (central pillar) significance*
      - *Architectural engineering principles*
      - *"Traditional craftsmen carved these from single hardwood logs"*
    - *Full points: "+35 XP, +10 EP" with coin animation*
    - *Achievement unlock: "Sharp Eye" badge (if first counting task)*
    - *"Next Task" button*
  - *Close but not exact (within tolerance):*
    - *Yellow "Almost!" indicator*
    - *Encouraging message: "Close! You counted 7. The correct answer is 8."*
    - *Explanation of where the missed element is located:*
      - *"There's one more pillar behind the left decorative panel that's partially hidden."*
      - *Annotated image highlighting the missed element*
    - *Partial credit: "+20 XP, +5 EP" (60% of full points)*
    - *Constructive feedback: "Great observation skills! These elements can be tricky to spot."*
    - *Option to "View All Elements" showing comprehensive labeled diagram*
  - *Significantly wrong (outside tolerance):*
    - *Orange "Try Again" message (still constructive)*
    - *"You counted 12, but there are 8 pillars. Would you like to recount?"*
    - *Hint provided: "Focus only on the main structural pillars, not decorative columns"*
    - *Visual guide: Image with counted elements highlighted*
    - *Minimal credit: "+10 XP" (participation reward)*
    - *"Recount" button (allows retry) or "Continue" (moves on)*
- *Post-task learning section:*
  - *"Did You Know?" fact panel:*
    - *Interesting trivia about the counted element*
    - *"Traditional Malay houses use an odd number of pillars for structural stability and cultural symbolism"*
    - *Link to full cultural guide for deeper learning*
  - *Gallery of labeled photos showing all counted elements clearly*
  - *Interactive 3D model (if implemented) allowing virtual rotation to see all angles*
- *Progress tracking:*
  - *Category advancement: "Historical Sites: +6% progress"*
  - *Task streak: "3 tasks in a row!"*
- *Accessibility features:*
  - *Voice guidance: "Current count: 8" announced when number changes*
  - *Keyboard controls: Arrow keys to increment/decrement*
  - *Screen reader support for all buttons and feedback*
- *Metadata:*
  - *Estimated time: "~3-5 minutes" with timer optional*
  - *Photos taken counter (if users photograph while counting): "Took 4 photos during task"*]*

The Count & Confirm task type introduces analytical problem-solving that transforms architectural and environmental details into engaging challenges requiring physical exploration and careful observation. This task variant addresses different cognitive preferences compared to knowledge-based quizzes, appealing to users who prefer analytical thinking over memorization. The counting mechanic leverages natural human competitiveness around accuracy and completeness, creating intrinsic motivation to achieve perfect counts rather than rely solely on extrinsic point rewards.

The task design implements progressive difficulty through subject complexity. Counting pillars visible from a single vantage point represents Easy difficulty, while counting elements requiring movement to see all instances (windows on multiple building sides, decorative carvings across a compound) represents Hard difficulty. The difficulty indicator sets expectations appropriately, with harder tasks offering proportionally higher XP rewards to justify the increased effort. This difficulty scaling maintains engagement across user skill levels—beginners gain confidence through Easy tasks while advanced users find sufficient challenge in Hard variants.

The interface prioritizes usability through large touch targets and clear visual feedback. The stepper buttons (+ and −) provide foolproof input method that eliminates keyboard typing errors, particularly valuable for older users or those with motor control challenges. The minimum 60px touch target size exceeds WCAG AAA accessibility standards (minimum 44px), ensuring reliable tap accuracy even for users with limited dexterity. The haptic feedback (vibration on tap) provides multisensory confirmation that's particularly useful in bright outdoor conditions where visual feedback might be harder to perceive.

The confirmation checkbox ("I have carefully counted...") serves a psychological function beyond interface requirement. By explicitly asking users to confirm careful counting, the system activates the commitment-consistency bias—users who check this box are psychologically primed to have actually counted carefully, improving answer accuracy. This checkbox also reduces random guessing; users who haven't physically counted are less likely to falsely confirm careful counting, self-filtering unreliable submissions. The checkbox thus improves data quality without adding intrusive validation steps.

The partial credit system acknowledges the genuine difficulty of precise counting in complex real-world environments. Architectural elements may be partially obscured by vegetation, lighting conditions might make distant elements harder to perceive, or users might legitimately disagree about whether partially visible elements should count. The tolerance range (typically ±2 for medium-difficulty tasks) recognizes this ambiguity while still rewarding accurate observation. The system awards 60% credit for "close" answers (within tolerance) versus full credit for exact matches, balancing achievement standards with realistic accommodation of counting challenges.

The detailed feedback mechanism transforms counting tasks from mere enumeration into architectural education. When users receive explanations about *why* traditional Malay houses use specific numbers of pillars—structural stability combined with cultural symbolism preferring odd numbers—the counting exercise becomes cultural anthropology rather than arithmetic. The annotated images showing missed elements teach observation skills by explicitly demonstrating "here's what you overlooked," improving future task performance through experiential learning. This feedback implements the error-correction learning cycle documented in educational psychology research.

The "Did You Know?" trivia section capitalizes on the psychological state of curiosity immediately following task completion. Users who just invested effort in counting pillars are maximally receptive to learning interesting facts about those pillars—the cognitive investment creates information-seeking mindset that makes subsequent learning more effective. This timing of educational content delivery maximizes retention compared to presenting the same information before the task (when users lack context) or much later (when context has faded from memory).

**[CONTINUED IN PART 3 - Due to length constraints]**

---

**[END OF PART 2]**

**Sections Completed:**
- ✅ 4.2.1.2 Tourist User Interface (Figures 4.8 through 4.14 with detailed descriptions)
  - Homepage / Attraction Discovery
  - Attraction Detail Page
  - QR Code Scanning Interface
  - Quiz Task
  - Check-In Task
  - Observation Match Task
  - Count & Confirm Task

**Still to be created in Part 3:**
- Figure 4.15: Direction & Orientation Task
- Figure 4.16: Time-Based Challenge
- Figure 4.17: Progress Tracking Dashboard
- Figure 4.18: Rewards Collection Gallery
- Figure 4.19: Mapbox Navigation Interface
- Figure 4.20: Report Submission Interface
- Section 4.2.1.3: Administrative Interface (Figures 4.21-4.29)
- Section 4.2.2: Backend Implementation Evidence (Figures 4.30-4.34)
- Section 4.2.3: Implementation Accomplishments Summary
- Section 4.3: Objective 3 Accomplishment (Evaluation)
- Section 4.4: Chapter Summary

**Note:** Part 2 is approximately 17-18 pages, ~7,500 words. Total Chapter 4 when complete will be approximately 50-60 pages.