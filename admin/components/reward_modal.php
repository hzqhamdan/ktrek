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
                    <select id="rewardRarity">
                        <option value="common">Common</option>
                        <option value="rare">Rare</option>
                        <option value="epic">Epic</option>
                        <option value="legendary">Legendary</option>
                    </select>
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
                <h4 style="margin-top: 0; color: #5E35B1; margin-bottom: 10px;">💎 XP/EP Rewards (Automatic)</h4>
                <p style="color: #666; font-size: 13px; margin-bottom: 10px;">XP and EP are automatically calculated based on trigger type:</p>
                
                <table style="width: 100%; font-size: 12px; color: #444;">
                    <tr>
                        <td style="padding: 5px;"><strong>Task Completion:</strong></td>
                        <td style="padding: 5px;">50 XP</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Attraction Completion:</strong></td>
                        <td style="padding: 5px;">200 XP + 100 EP</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Category 33% (Bronze):</strong></td>
                        <td style="padding: 5px;">50 EP</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Category 66% (Silver):</strong></td>
                        <td style="padding: 5px;">100 EP</td>
                    </tr>
                    <tr>
                        <td style="padding: 5px;"><strong>Category 100% (Gold):</strong></td>
                        <td style="padding: 5px;">200 EP</td>
                    </tr>
                </table>
                
                <p style="color: #666; font-size: 11px; margin-top: 10px; margin-bottom: 0;"><em>Note: These values are system-defined and cannot be customized per reward.</em></p>
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
