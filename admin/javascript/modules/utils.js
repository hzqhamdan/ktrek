// ============================================
// UTILITY FUNCTIONS MODULE
// ============================================
// Common utility functions used across the admin panel

/**
 * Show alert message
 */
export function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;

    const colors = {
        success: '#10b981',
        error: '#ef4444',
        warning: '#f59e0b',
        info: '#3b82f6'
    };

    alertDiv.style.backgroundColor = colors[type] || colors.info;
    alertDiv.textContent = message;

    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => alertDiv.remove(), 300);
    }, 3000);
}

/**
 * Show form alert within a specific form
 */
export function showFormAlert(formElement, message, type = 'error') {
    clearFormAlerts(formElement);
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `form-alert alert-${type}`;
    alertDiv.style.cssText = `
        padding: 12px;
        margin-bottom: 15px;
        border-radius: 6px;
        font-size: 14px;
    `;
    
    const colors = {
        success: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
        error: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
        warning: { bg: '#fef3c7', text: '#92400e', border: '#fcd34d' },
        info: { bg: '#dbeafe', text: '#1e40af', border: '#93c5fd' }
    };
    
    const color = colors[type] || colors.error;
    alertDiv.style.backgroundColor = color.bg;
    alertDiv.style.color = color.text;
    alertDiv.style.border = `1px solid ${color.border}`;
    alertDiv.textContent = message;
    
    formElement.insertBefore(alertDiv, formElement.firstChild);
}

/**
 * Clear all form alerts
 */
export function clearFormAlerts(formElement) {
    if (!formElement) return;
    const alerts = formElement.querySelectorAll('.form-alert');
    alerts.forEach(alert => alert.remove());
}

/**
 * Show loading state in a table
 */
export function showTableLoading(tableBodyId) {
    const tbody = document.getElementById(tableBodyId);
    if (!tbody) return;
    
    tbody.innerHTML = `
        <tr>
            <td colspan="100%" style="text-align: center; padding: 40px;">
                <div class="spinner"></div>
                <p style="margin-top: 15px; color: #6b7280;">Loading...</p>
            </td>
        </tr>
    `;
}

/**
 * Get time ago string from timestamp
 */
export function getTimeAgo(timestamp) {
    const now = new Date();
    const past = new Date(timestamp);
    const diffMs = now - past;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    if (diffHours > 0) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffMins > 0) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    return 'Just now';
}

/**
 * Validate form fields
 */
export function validateFormFields(fieldIds) {
    for (const fieldId of fieldIds) {
        const field = document.getElementById(fieldId);
        if (!field) continue;
        
        if (!field.value || field.value.trim() === '') {
            showAlert(`Please fill in the ${fieldId.replace(/([A-Z])/g, ' $1').toLowerCase()} field`, 'error');
            field.focus();
            return false;
        }
    }
    return true;
}

/**
 * Upload file helper
 */
export async function uploadFile(fileInputId) {
    const fileInput = document.getElementById(fileInputId);
    if (!fileInput || !fileInput.files[0]) {
        throw new Error('No file selected');
    }

    const formData = new FormData();
    formData.append('file', fileInput.files[0]);

    const response = await fetch('api/upload.php', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
    });

    const data = await response.json();
    
    if (!data.success) {
        throw new Error(data.message || 'Upload failed');
    }

    return data.file_url;
}

/**
 * Format date for display
 */
export function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

/**
 * Confirm action dialog
 */
export function confirmAction(message) {
    return confirm(message);
}
