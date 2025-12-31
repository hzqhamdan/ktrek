import axios from 'axios';

const API_BASE_URL = 'http://localhost/backend/api';

// Create axios instance
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    },
    withCredentials: true
});

// Add token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Auth APIs
export const authAPI = {
    register: (data) => api.post('/auth/register.php', data),
    login: (data) => api.post('/auth/login.php', data),
    logout: () => api.post('/auth/logout.php'),
    verifySession: () => api.get('/auth/verify-session.php')
};

// Attractions APIs
export const attractionsAPI = {
    getAll: () => api.get('/attractions/get-all.php'),
    getById: (id) => api.get(`/attractions/get-by-id.php?id=${id}`),
    getTasks: (attractionId) => api.get(`/attractions/get-tasks.php?attraction_id=${attractionId}`)
};

// Tasks APIs
export const tasksAPI = {
    getQuiz: (taskId) => api.get(`/tasks/get-quiz.php?task_id=${taskId}`),
    submitQuiz: (data) => api.post('/tasks/submit-quiz.php', data),
    submitPhoto: (formData) => api.post('/tasks/submit-photo.php', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    submitCheckin: (data) => api.post('/tasks/submit-checkin.php', data)
};

// Progress APIs
export const progressAPI = {
    getUserProgress: () => api.get('/progress/get-user-progress.php'),
    getAttractionProgress: (attractionId) => 
        api.get(`/progress/get-attraction-progress.php?attraction_id=${attractionId}`)
};

// Rewards APIs
export const rewardsAPI = {
    getUserRewards: () => api.get('/rewards/get-user-rewards.php')
};

// QR APIs
export const qrAPI = {
    verifyQR: (qrCode) => api.post('/qr/verify-qr.php', { qr_code: qrCode })
};

// Reports APIs
export const reportsAPI = {
    submit: (data) => api.post('/reports/submit-report.php', data),
    getUserReports: () => api.get('/reports/get-user-reports.php')
};

export default api;