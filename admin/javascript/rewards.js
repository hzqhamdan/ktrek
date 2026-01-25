// Reward Management JavaScript
// Handles all reward CRUD operations and UI interactions

// Note: allAttractions and allTasks are already declared in main.js, so we reuse them

// Load all rewards on page load
function loadRewards() {
    fetch('api/rewards.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                populateRewardTable(data.rewards);
            } else {
                showAlert(data.message || 'Failed to load rewards', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading rewards:', error);
            showAlert('Error loading rewards', 'error');
        });
}

// Populate rewards table
function populateRewardTable(rewards) {
    const tbody = document.getElementById('rewardsTable');
    
    if (!rewards || rewards.length === 0) {
        tbody.innerHTML = '<tr><td colspan="10" style="text-align: center; color: #888;">No rewards found</td></tr>';
        return;
    }

    tbody.innerHTML = rewards.map(reward => {
        const icon = getRewardIconHTML(reward.reward_type, reward.image);
        const typeBadge = getTypeBadge(reward.reward_type);
        const rarityBadge = getRarityBadge(reward.rarity);
        const statusBadge = getStatusBadge(reward.is_active);
        const triggerText = getTriggerText(reward.trigger_type);
        const categoryText = reward.category ? reward.category.charAt(0).toUpperCase() + reward.category.slice(1) : '-';
        
        return `
            <tr>
                <td>${reward.id}</td>
                <td>${icon}</td>
                <td><strong>${reward.title}</strong></td>
                <td>${typeBadge}</td>
                <td>${categoryText}</td>
                <td>${triggerText}</td>
                <td>${rarityBadge}</td>
                <td>${statusBadge}</td>
                <td>
                    <button class="btn" onclick="editReward(${reward.id})" style="padding: 5px 10px; font-size: 12px; margin-right: 5px;">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="btn" onclick="toggleRewardStatus(${reward.id}, ${reward.is_active})" 
                            style="padding: 5px 10px; font-size: 12px; margin-right: 5px; background: ${reward.is_active ? '#ef4444' : '#10b981'};">
                        <i class="fas fa-${reward.is_active ? 'ban' : 'check'}"></i> ${reward.is_active ? 'Deactivate' : 'Activate'}
                    </button>
                    <button class="btn" onclick="deleteReward(${reward.id})" style="padding: 5px 10px; font-size: 12px; background: #ef4444;">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Get reward icon HTML
function getRewardIconHTML(type, imageUrl) {
    if (imageUrl && imageUrl.trim() !== '') {
        return `<img src="${imageUrl}" alt="${type}" style="width: 40px; height: 40px; border-radius: 6px; object-fit: cover;">`;
    }
    
    // Default icons based on type
    const icons = {
        'badge': '🏅',
        'title': '👑'
    };
    
    return `<div style="font-size: 24px;">${icons[type] || '🎁'}</div>`;
}

// Get type badge HTML
function getTypeBadge(type) {
    const colors = {
        'badge': '#3b82f6',
        'title': '#8b5cf6'
    };
    
    return `<span style="background: ${colors[type] || '#6b7280'}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${type ? type.toUpperCase() : 'N/A'}</span>`;
}

// Get rarity badge HTML
function getRarityBadge(rarity) {
    const colors = {
        'common': '#9ca3af',
        'rare': '#3b82f6',
        'epic': '#8b5cf6',
        'legendary': '#f59e0b'
    };
    
    return `<span style="background: ${colors[rarity] || '#6b7280'}; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">${rarity ? rarity.toUpperCase() : 'COMMON'}</span>`;
}

// Get status badge HTML
function getStatusBadge(isActive) {
    return isActive 
        ? '<span style="background: #10b981; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">ACTIVE</span>'
        : '<span style="background: #ef4444; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px; font-weight: 600;">INACTIVE</span>';
}

// Get trigger text
function getTriggerText(triggerType) {
    const triggers = {
        'task_completion': '✅ Task',
        'task_set_completion': '✅✅ Task Set',
        'task_type_completion': '🎯 Task Type',
        'attraction_completion': '🏛️ Attraction',
        'category_milestone': '📊 Category',
        'manual': '🖐️ Manual'
    };
    
    return triggers[triggerType] || '-';
}

// Open reward modal for create/edit
function openRewardModal(id = null) {
    const modal = document.getElementById('rewardModal');
    const modalTitle = document.getElementById('rewardModalTitle');
    const form = document.getElementById('rewardForm');
    
    // Reset form
    form.reset();
    document.getElementById('rewardId').value = '';
    document.getElementById('rewardImage').value = ''; // Hidden field still exists
    document.getElementById('rewardIsActive').checked = true;
    
    // Load attractions and tasks for dropdowns
    loadAttractionsForDropdown();
    loadTasksForDropdown();
    
    if (id) {
        // Edit mode
        modalTitle.textContent = 'Edit Reward';
        loadRewardData(id);
    } else {
        // Create mode
        modalTitle.textContent = 'Add Reward';
    }
    
    modal.style.display = 'flex';
    modal.style.alignItems = 'center';
    modal.style.justifyContent = 'center';
}

// Load reward data for editing
function loadRewardData(id) {
    fetch(`api/rewards.php?action=get&id=${id}`)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                const reward = data.reward;
                
                // Populate form fields
                document.getElementById('rewardId').value = reward.id;
                document.getElementById('rewardType').value = reward.reward_type || '';
                document.getElementById('rewardTitle').value = reward.title || '';
                // Identifier is auto-generated, so we store it but don't show it
                document.getElementById('rewardIdentifier').value = reward.reward_identifier || '';
                document.getElementById('rewardDescription').value = reward.description || '';
                document.getElementById('rewardCategory').value = reward.category || '';
                document.getElementById('rewardRarity').value = reward.rarity || 'common';
                // XP/EP are now auto-calculated, so we don't populate them
                document.getElementById('rewardIsActive').checked = reward.is_active == 1;
                
                // Image field removed - will be added later as separate component
                
                // Handle trigger configuration
                document.getElementById('rewardTriggerType').value = reward.trigger_type || '';
                handleTriggerTypeChange();
                
                // Set trigger conditions based on type
                if (reward.trigger_type && reward.trigger_condition) {
                    const condition = reward.trigger_condition;
                    
                    if (reward.trigger_type === 'task_completion' && condition.task_id) {
                        setTimeout(() => {
                            document.getElementById('triggerTaskId').value = condition.task_id;
                        }, 500);
                    } else if (reward.trigger_type === 'task_set_completion' && condition.task_ids) {
                        setTimeout(() => {
                            // Check the checkboxes for the selected task IDs
                            const taskIds = condition.task_ids;
                            document.querySelectorAll('.task-set-checkbox').forEach(checkbox => {
                                if (taskIds.includes(parseInt(checkbox.value))) {
                                    checkbox.checked = true;
                                }
                            });
                            updateTaskSetCount();
                        }, 500);
                    } else if (reward.trigger_type === 'task_type_completion' && condition.task_type) {
                        setTimeout(() => {
                            document.getElementById('triggerTaskType').value = condition.task_type;
                            if (condition.required_count) {
                                document.getElementById('triggerTaskTypeCount').value = condition.required_count;
                                updateTaskTypeCountPreview();
                            }
                        }, 500);
                    } else if (reward.trigger_type === 'attraction_completion' && condition.attraction_id) {
                        setTimeout(() => {
                            document.getElementById('triggerAttractionId').value = condition.attraction_id;
                        }, 500);
                    }
                    // category_milestone removed - now automatic
                }
            } else {
                showAlert(data.message || 'Failed to load reward data', 'error');
            }
        })
        .catch(error => {
            console.error('Error loading reward:', error);
            showAlert('Error loading reward data', 'error');
        });
}

// Close reward modal
function closeRewardModal() {
    const modal = document.getElementById('rewardModal');
    modal.style.display = 'none';
}

// Handle trigger type change
function handleTriggerTypeChange() {
    const triggerType = document.getElementById('rewardTriggerType').value;
    
    // Hide all trigger config sections
    document.querySelectorAll('.trigger-config').forEach(el => el.style.display = 'none');
    
    // Show relevant section based on trigger type
    if (triggerType === 'task_completion') {
        document.getElementById('taskCompletionTrigger').style.display = 'block';
    } else if (triggerType === 'task_set_completion') {
        document.getElementById('taskSetCompletionTrigger').style.display = 'block';
    } else if (triggerType === 'task_type_completion') {
        document.getElementById('taskTypeCompletionTrigger').style.display = 'block';
    } else if (triggerType === 'attraction_completion') {
        document.getElementById('attractionCompletionTrigger').style.display = 'block';
    } else if (triggerType === 'manual' || triggerType === '') {
        document.getElementById('manualTriggerInfo').style.display = 'block';
    }
    // category_milestone removed - now automatic
}

// Load attractions for dropdown
function loadAttractionsForDropdown() {
    fetch('api/attractions.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allAttractions = data.attractions;
                const select = document.getElementById('triggerAttractionId');
                select.innerHTML = '<option value="">Select Attraction</option>' +
                    data.attractions.map(attr => `<option value="${attr.id}">${attr.name}</option>`).join('');
            }
        })
        .catch(error => console.error('Error loading attractions:', error));
}

// Load tasks for dropdown
function loadTasksForDropdown() {
    fetch('api/tasks.php?action=list')
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                allTasks = data.tasks;
                const select = document.getElementById('triggerTaskId');
                select.innerHTML = '<option value="">Select Task</option>' +
                    data.tasks.map(task => `<option value="${task.id}">${task.name} (${task.attraction_name || 'No Attraction'})</option>`).join('');
                
                // Also populate task set checkboxes
                loadTaskSetCheckboxes(data.tasks);
            }
        })
        .catch(error => console.error('Error loading tasks:', error));
}

// Load task set checkboxes
function loadTaskSetCheckboxes(tasks) {
    const container = document.getElementById('taskSetCheckboxes');
    if (!tasks || tasks.length === 0) {
        container.innerHTML = '<p style="color: #666; text-align: center;">No tasks available</p>';
        return;
    }
    
    // Group tasks by attraction
    const tasksByAttraction = {};
    tasks.forEach(task => {
        const attractionName = task.attraction_name || 'No Attraction';
        if (!tasksByAttraction[attractionName]) {
            tasksByAttraction[attractionName] = [];
        }
        tasksByAttraction[attractionName].push(task);
    });
    
    // Build HTML with grouped checkboxes
    let html = '';
    Object.keys(tasksByAttraction).sort().forEach(attractionName => {
        html += `
            <div style="margin-bottom: 15px;">
                <div style="font-weight: 600; color: #5E35B1; margin-bottom: 8px; padding-bottom: 5px; border-bottom: 2px solid #e5e7eb;">
                    ${attractionName}
                </div>
        `;
        
        tasksByAttraction[attractionName].forEach(task => {
            html += `
                <label style="display: flex; align-items: center; padding: 6px 8px; cursor: pointer; border-radius: 6px; transition: background 0.2s;" 
                       onmouseover="this.style.background='#f3f4f6'" 
                       onmouseout="this.style.background='transparent'">
                    <input type="checkbox" 
                           class="task-set-checkbox" 
                           value="${task.id}" 
                           onchange="updateTaskSetCount()"
                           style="margin-right: 8px; cursor: pointer;">
                    <span style="font-size: 13px; color: #374151;">${task.name}</span>
                </label>
            `;
        });
        
        html += '</div>';
    });
    
    container.innerHTML = html;
    updateTaskSetCount();
}

// Update task set count display
function updateTaskSetCount() {
    const checkboxes = document.querySelectorAll('.task-set-checkbox:checked');
    const countDisplay = document.getElementById('taskSetCount');
    const count = checkboxes.length;
    
    if (count === 0) {
        countDisplay.innerHTML = '<span style="color: #ef4444;">⚠️ Please select at least one task</span>';
    } else {
        countDisplay.innerHTML = `✓ ${count} task${count > 1 ? 's' : ''} selected`;
    }
}

// Save reward (create or update)
document.getElementById('rewardForm')?.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const rewardId = document.getElementById('rewardId').value;
    const action = rewardId ? 'update' : 'create';
    
    // Auto-generate identifier from title
    const title = document.getElementById('rewardTitle').value;
    const autoIdentifier = title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '_') // Replace spaces with underscores
        .replace(/-+/g, '_') // Replace hyphens with underscores
        .replace(/_+/g, '_') // Remove duplicate underscores
        .substring(0, 50); // Limit length
    
    // Gather form data
    const formData = {
        action: action,
        reward_type: document.getElementById('rewardType').value,
        title: title,
        reward_identifier: autoIdentifier + '_' + Date.now(), // Add timestamp for uniqueness
        description: document.getElementById('rewardDescription').value,
        category: document.getElementById('rewardCategory').value,
        rarity: document.getElementById('rewardRarity').value,
        xp_amount: 0, // Auto-calculated by backend based on trigger type
        ep_amount: 0, // Auto-calculated by backend based on trigger type
        is_active: document.getElementById('rewardIsActive').checked ? 1 : 0,
        trigger_type: document.getElementById('rewardTriggerType').value,
        image: document.getElementById('rewardImage').value
    };
    
    if (rewardId) {
        formData.id = parseInt(rewardId);
    }
    
    // Build trigger_condition based on trigger type
    const triggerType = formData.trigger_type;
    if (triggerType === 'task_completion') {
        const taskId = document.getElementById('triggerTaskId').value;
        if (taskId) {
            formData.trigger_condition = { task_id: parseInt(taskId) };
        }
    } else if (triggerType === 'task_set_completion') {
        const selectedTasks = Array.from(document.querySelectorAll('.task-set-checkbox:checked'))
            .map(cb => parseInt(cb.value));
        if (selectedTasks.length > 0) {
            formData.trigger_condition = { task_ids: selectedTasks };
        } else {
            showAlert('Please select at least one task for the task set trigger', 'error');
            return;
        }
    } else if (triggerType === 'task_type_completion') {
        const taskType = document.getElementById('triggerTaskType').value;
        const taskTypeCount = document.getElementById('triggerTaskTypeCount').value;
        if (taskType) {
            formData.trigger_condition = { 
                task_type: taskType,
                required_count: parseInt(taskTypeCount) || 1
            };
        } else {
            showAlert('Please select a task type for the task type completion trigger', 'error');
            return;
        }
    } else if (triggerType === 'attraction_completion') {
        const attractionId = document.getElementById('triggerAttractionId').value;
        if (attractionId) {
            formData.trigger_condition = { attraction_id: parseInt(attractionId) };
        }
    }
    // category_milestone removed - now automatic
    
    // Image upload removed - will be added later as separate component
    // formData.image is already set from hidden field or will be null
    
    // Submit form data
    fetch('api/rewards.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message || 'Reward saved successfully', 'success');
            closeRewardModal();
            loadRewards();
        } else {
            showAlert(data.message || 'Failed to save reward', 'error');
        }
    })
    .catch(error => {
        console.error('Error saving reward:', error);
        showAlert('Error saving reward', 'error');
    });
});

// Upload reward image
async function uploadRewardImage(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', 'reward');
    
    const response = await fetch('api/upload.php', {
        method: 'POST',
        body: formData
    });
    
    const data = await response.json();
    
    if (data.success) {
        return data.file_path;
    } else {
        throw new Error(data.message || 'Upload failed');
    }
}

// Delete reward
function deleteReward(id) {
    if (!confirm('Are you sure you want to delete this reward? This action cannot be undone.')) {
        return;
    }
    
    fetch('api/rewards.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete', id: id })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message || 'Reward deleted successfully', 'success');
            loadRewards();
        } else {
            showAlert(data.message || 'Failed to delete reward', 'error');
        }
    })
    .catch(error => {
        console.error('Error deleting reward:', error);
        showAlert('Error deleting reward', 'error');
    });
}

// Toggle reward status
function toggleRewardStatus(id, currentStatus) {
    const newStatus = currentStatus ? 0 : 1;
    const action = newStatus ? 'activate' : 'deactivate';
    
    if (!confirm(`Are you sure you want to ${action} this reward?`)) {
        return;
    }
    
    fetch('api/rewards.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'toggle_active', id: id, is_active: newStatus })
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            showAlert(data.message || 'Reward status updated', 'success');
            loadRewards();
        } else {
            showAlert(data.message || 'Failed to update status', 'error');
        }
    })
    .catch(error => {
        console.error('Error updating status:', error);
        showAlert('Error updating status', 'error');
    });
}

// Edit reward
function editReward(id) {
    openRewardModal(id);
}

// Apply reward filters
function applyRewardFilters() {
    const searchTerm = document.getElementById('rewardSearchInput').value.trim();
    const typeFilter = document.getElementById('rewardTypeFilter').value;
    const statusFilter = document.getElementById('rewardStatusFilter').value;
    
    let url = 'api/rewards.php?action=list';
    if (searchTerm) {
        url += `&search=${encodeURIComponent(searchTerm)}`;
    }
    
    fetch(url)
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                let filteredRewards = data.rewards;
                
                // Apply client-side filters
                if (typeFilter) {
                    filteredRewards = filteredRewards.filter(r => r.reward_type === typeFilter);
                }
                if (statusFilter !== '') {
                    filteredRewards = filteredRewards.filter(r => r.is_active == statusFilter);
                }
                
                populateRewardTable(filteredRewards);
            } else {
                showAlert(data.message || 'Failed to filter rewards', 'error');
            }
        })
        .catch(error => {
            console.error('Error filtering rewards:', error);
            showAlert('Error filtering rewards', 'error');
        });
}

// Clear reward filters
function clearRewardFilters() {
    document.getElementById('rewardSearchInput').value = '';
    document.getElementById('rewardTypeFilter').value = '';
    document.getElementById('rewardStatusFilter').value = '';
    loadRewards();
}

// Close modal when clicking outside
window.onclick = function(event) {
    const modal = document.getElementById('rewardModal');
    if (event.target === modal) {
        closeRewardModal();
    }
};
