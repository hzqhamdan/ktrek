<!-- Reward Modal -->
<div id="rewardModal" class="modal">
    <div class="modal-content" style="max-width: 800px;">
        <div class="modal-header">
            <h3 id="rewardModalTitle">Add Reward</h3>
            <button class="close-btn" onclick="closeRewardModal()">&times;</button>
        </div>
        <form id="rewardForm">
            <input type="hidden" id="rewardId">
            <input type="hidden" id="rewardImage">
            
            <!-- Basic Information Section -->
            <div style="background: #f9fafb; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin-top: 0; color: #5E35B1; margin-bottom: 15px;">📋 Basic Information</h4>
                
                <div class="form-group">
                    <label>Reward Type*</label>
                    <select id="rewardType" required>
                        <option value="">Select Type</option>
                        <option value="badge">🏅 Badge</option>
                        <option value="title">👑 Title</option>
                    </select>
                    <small style="color: #666; font-size: 12px;">The type of reward users will earn</small>
                </div>

                <div class="form-group">
                    <label>Title*</label>
                    <input type="text" id="rewardTitle" required placeholder="e.g., Cultural Explorer Badge">
                    <small style="color: #666; font-size: 12px;">A unique identifier will be auto-generated from this title</small>
                </div>

                <!-- Hidden field for auto-generated identifier -->
                <input type="hidden" id="rewardIdentifier">

                <div class="form-group">
                    <label>Description*</label>
                    <textarea id="rewardDescription" required rows="3" placeholder="Describe what this reward represents..."></textarea>
                </div>

                <div class="form-group">
                    <label>Category</label>
                    <select id="rewardCategory">
                        <option value="">No Category</option>
                        <option value="cultural">🏛️ Cultural</option>
                        <option value="nature">🌳 Nature</option>
                        <option value="adventure">⛰️ Adventure</option>
                        <option value="culinary">🍜 Culinary</option>
                        <option value="heritage">🏺 Heritage</option>
                    </select>
                    <small style="color: #666; font-size: 12px;">Optional category for organizing rewards</small>
                </div>

                <div class="form-group">
                    <label>Rarity</label>
                    <select id="rewardRarity" onchange="updateXPPreview()">
                        <option value="common">Common - 50 XP</option>
                        <option value="rare">Rare - 100 XP</option>
                        <option value="epic">Epic - 200 XP</option>
                        <option value="legendary">Legendary - 500 XP</option>
                    </select>
                    <small style="color: #666; font-size: 12px;">Higher rarity = More XP for users</small>
                </div>

                <div class="form-group">
                    <label style="display: flex; align-items: center; gap: 10px; cursor: pointer;">
                        <input type="checkbox" id="rewardIsActive" checked style="width: auto; margin: 0;">
                        <span>Active (users can earn this reward)</span>
                    </label>
                </div>
            </div>

            <!-- Trigger Configuration Section -->
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <h4 style="margin-top: 0; color: #5E35B1; margin-bottom: 15px;">🎯 Trigger Configuration</h4>
                <p style="color: #666; font-size: 13px; margin-bottom: 15px;">Define when and how users earn this reward</p>

                <div class="form-group">
                    <label>Trigger Type</label>
                    <select id="rewardTriggerType" onchange="handleTriggerTypeChange()">
                        <option value="">No Trigger (Manual Only)</option>
                        <option value="task_completion">✅ Single Task Completion</option>
                        <option value="task_set_completion">✅✅ Task Set Completion</option>
                        <option value="task_type_completion">🎯 Task Type Completion</option>
                        <option value="attraction_completion">🏛️ Attraction Completion</option>
                        <option value="manual">🖐️ Manual Award Only</option>
                    </select>
                    <small style="color: #666; font-size: 12px;">When should this reward be automatically awarded?</small>
                    <small style="color: #10b981; font-size: 11px; display: block; margin-top: 5px;">
                        ℹ️ Category tier badges (Bronze/Silver/Gold) are automatically awarded at 33%, 66%, 100%
                    </small>
                </div>

                <!-- Task Completion Trigger -->
                <div id="taskCompletionTrigger" style="display: none;" class="trigger-config">
                    <div class="form-group">
                        <label>Select Task</label>
                        <select id="triggerTaskId">
                            <option value="">Loading tasks...</option>
                        </select>
                        <small style="color: #666; font-size: 12px;">Reward will be given when this specific task is completed</small>
                    </div>
                </div>

                <!-- Task Set Completion Trigger -->
                <div id="taskSetCompletionTrigger" style="display: none;" class="trigger-config">
                    <div class="form-group">
                        <label>Select Multiple Tasks</label>
                        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 10px; max-height: 250px; overflow-y: auto;">
                            <div id="taskSetCheckboxes">
                                <p style="color: #666; text-align: center;">Loading tasks...</p>
                            </div>
                        </div>
                        <small style="color: #666; font-size: 12px;">Reward will be given when ALL selected tasks are completed</small>
                        <div id="taskSetCount" style="margin-top: 8px; color: #5E35B1; font-weight: 600; font-size: 12px;"></div>
                    </div>
                </div>

                <!-- Task Type Completion Trigger -->
                <div id="taskTypeCompletionTrigger" style="display: none;" class="trigger-config">
                    <div class="form-group">
                        <label>Select Task Type</label>
                        <select id="triggerTaskType">
                            <option value="">Select a task type...</option>
                            <option value="checkin">📍 Check-in (Required First)</option>
                            <option value="quiz">📝 Quiz</option>
                            <option value="observation_match">👁️ Observation Match</option>
                            <option value="count_confirm">🔢 Count Confirm</option>
                            <option value="direction">🧭 Direction</option>
                            <option value="time_based">⏱️ Time Based</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label>Number of Tasks Required</label>
                        <input type="number" id="triggerTaskTypeCount" min="1" value="1" style="width: 100px;">
                        <small style="color: #666; font-size: 12px; display: block; margin-top: 5px;">
                            How many tasks of this type must the user complete?
                        </small>
                        <div id="taskTypeCountPreview" style="margin-top: 8px; padding: 10px; background: #f0f9ff; border-radius: 6px; border-left: 3px solid #3b82f6; font-size: 13px; color: #1e40af;">
                            💡 User will earn this badge after completing <strong>1</strong> task(s) of this type
                        </div>
                    </div>
                </div>

                <!-- Attraction Completion Trigger -->
                <div id="attractionCompletionTrigger" style="display: none;" class="trigger-config">
                    <div class="form-group">
                        <label>Select Attraction</label>
                        <select id="triggerAttractionId">
                            <option value="">Loading attractions...</option>
                        </select>
                        <small style="color: #666; font-size: 12px;">Reward will be given when all tasks at this attraction are completed</small>
                    </div>
                </div>

                <!-- Category Milestone Trigger - REMOVED: Now automatic -->

                <!-- Manual Trigger Info -->
                <div id="manualTriggerInfo" style="display: none;" class="trigger-config">
                    <div style="background: #fff3cd; padding: 12px; border-radius: 6px; border-left: 4px solid #ffc107;">
                        <p style="margin: 0; color: #856404; font-size: 13px;">
                            <strong>Manual Award Only:</strong> This reward can only be given manually by administrators. It will not be automatically awarded.
                        </p>
                    </div>
                </div>
            </div>

            <!-- XP/EP Info Section -->
            <div style="background: #f0f9ff; padding: 15px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #3b82f6;">
                <h4 style="margin-top: 0; color: #5E35B1; margin-bottom: 10px;">💎 XP Rewards (Automatic by Rarity)</h4>
                <p style="color: #666; font-size: 13px; margin-bottom: 10px;">XP is automatically awarded based on the rarity you select:</p>
                
                <div id="xpPreview" style="background: white; padding: 12px; border-radius: 6px; border: 2px solid #10b981; margin-bottom: 10px;">
                    <div style="font-size: 14px; color: #10b981; font-weight: 600;">
                        <span id="xpPreviewRarity">Common</span> Badge = <span id="xpPreviewAmount">50</span> XP
                    </div>
                </div>
                
                <table style="width: 100%; font-size: 12px; color: #444; background: white; border-radius: 6px; overflow: hidden;">
                    <tr style="background: #f9fafb;">
                        <td style="padding: 8px; font-weight: 600;">Rarity</td>
                        <td style="padding: 8px; font-weight: 600;">XP Awarded</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">Common</td>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">50 XP</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">Rare</td>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">100 XP</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">Epic</td>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">200 XP</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">Legendary</td>
                        <td style="padding: 5px; border-top: 1px solid #e5e7eb;">500 XP</td>
                    </tr>
                </table>
                
                <p style="color: #666; font-size: 11px; margin-top: 10px; margin-bottom: 0;"><em>💡 Tip: Use higher rarities for more challenging achievements!</em></p>
            </div>
            
            <!-- Hidden fields for XP/EP (set to 0, calculated by backend) -->
            <input type="hidden" id="rewardXP" value="0">
            <input type="hidden" id="rewardEP" value="0">

            <button type="submit" class="btn" style="width: 100%;">
                <i class="fas fa-save"></i> Save Reward
            </button>
        </form>
    </div>
</div>

<style>
.trigger-config {
    background: white;
    padding: 12px;
    border-radius: 6px;
    margin-top: 10px;
    border: 1px solid #e5e7eb;
}
</style>

<script>
// Update XP preview based on rarity selection
function updateXPPreview() {
    const rarity = document.getElementById('rewardRarity').value;
    const xpValues = {
        'common': 50,
        'rare': 100,
        'epic': 200,
        'legendary': 500
    };
    
    const xpAmount = xpValues[rarity] || 50;
    const rarityCapitalized = rarity.charAt(0).toUpperCase() + rarity.slice(1);
    
    document.getElementById('xpPreviewRarity').textContent = rarityCapitalized;
    document.getElementById('xpPreviewAmount').textContent = xpAmount;
    
    // Update border color based on rarity
    const preview = document.getElementById('xpPreview');
    const colors = {
        'common': '#9ca3af',
        'rare': '#3b82f6',
        'epic': '#8b5cf6',
        'legendary': '#f59e0b'
    };
    preview.style.borderColor = colors[rarity];
    document.getElementById('xpPreviewRarity').style.color = colors[rarity];
}

// Update task type count preview
function updateTaskTypeCountPreview() {
    const count = document.getElementById('triggerTaskTypeCount')?.value || 1;
    const previewElement = document.getElementById('taskTypeCountPreview');
    if (previewElement) {
        previewElement.innerHTML = `💡 User will earn this badge after completing <strong>${count}</strong> task(s) of this type`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    updateXPPreview();
    
    // Add event listener for task type count input
    const taskTypeCountInput = document.getElementById('triggerTaskTypeCount');
    if (taskTypeCountInput) {
        taskTypeCountInput.addEventListener('input', updateTaskTypeCountPreview);
    }
});
</script>
