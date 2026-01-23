<!-- User Profile Detail Modal -->
<div class="modal" id="userProfileModal">
    <div class="modal-content user-profile-modal-content">
        <div class="modal-header">
            <h2>User Profile Details</h2>
            <button class="modal-close" onclick="closeUserProfileModal()">&times;</button>
        </div>
        
        <div class="modal-body" id="userProfileContent">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Loading user details...</p>
            </div>
        </div>
    </div>
</div>

<style>
.user-profile-modal-content {
    max-width: 1000px;
    width: 95%;
    max-height: 90vh;
}

.user-profile-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 20px;
    background: #3d2a1d;
    border-radius: 8px;
    margin-bottom: 20px;
}

.user-avatar {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: linear-gradient(135deg, #c9b7a9 0%, #a89786 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 32px;
    color: #362419;
    font-weight: 700;
}

.user-basic-info h3 {
    margin: 0 0 5px 0;
    color: #c9b7a9;
    font-size: 22px;
}

.user-basic-info p {
    margin: 3px 0;
    font-size: 13px;
    color: #c9b7a9;
    opacity: 0.8;
}

.profile-tabs {
    display: flex;
    gap: 10px;
    margin-bottom: 20px;
    border-bottom: 2px solid rgba(201, 183, 169, 0.2);
}

.profile-tab-btn {
    padding: 10px 20px;
    background: none;
    border: none;
    border-bottom: 3px solid transparent;
    color: #362419;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    transition: all 0.2s;
}

.profile-tab-btn:hover {
    opacity: 1;
    background: rgba(54, 36, 25, 0.1);
}

.profile-tab-btn.active {
    border-bottom-color: #362419;
    opacity: 1;
}

.profile-tab-content {
    display: none;
}

.profile-tab-content.active {
    display: block;
}

.info-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 20px;
}

.info-item {
    background: #3d2a1d;
    padding: 15px;
    border-radius: 6px;
}

.info-item label {
    font-size: 11px;
    text-transform: uppercase;
    color: #c9b7a9;
    opacity: 0.7;
    display: block;
    margin-bottom: 5px;
}

.info-item value {
    font-size: 16px;
    font-weight: 600;
    color: #c9b7a9;
}

.timeline-item {
    padding: 12px;
    background: #3d2a1d;
    border-left: 3px solid;
    border-radius: 4px;
    margin-bottom: 10px;
}

.timeline-item .time {
    font-size: 11px;
    color: #c9b7a9;
    opacity: 0.6;
}

.timeline-item .content {
    margin-top: 5px;
    font-size: 13px;
    color: #c9b7a9;
}

.device-card {
    background: #3d2a1d;
    padding: 15px;
    border-radius: 8px;
    margin-bottom: 10px;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.device-info h4 {
    margin: 0 0 5px 0;
    color: #c9b7a9;
    font-size: 15px;
}

.device-info p {
    margin: 3px 0;
    font-size: 12px;
    color: #c9b7a9;
    opacity: 0.7;
}

.loading-spinner {
    text-align: center;
    padding: 40px;
}

.loading-spinner p {
    margin-top: 15px;
    color: #362419;
}
</style>
