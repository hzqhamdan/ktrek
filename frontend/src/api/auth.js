import api from "./index";

export const authAPI = {
  // Check if identifier (email/phone) is already registered
  // Returns `{ success: true }` when available, or `{ success: false, errors: ... }` when taken.
  checkIdentifier: async (emailOrPhone) => {
    try {
      const response = await api.post("/auth/check-identifier.php", { email: emailOrPhone });
      return response.data;
    } catch (error) {
      if (error?.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Register new user
  // Note: backend uses HTTP 400 for validation/duplicate errors. We normalize
  // these into a resolved `{ success: false, ... }` payload so UIs can show
  // friendly feedback without relying on try/catch.
  register: async (userData) => {
    try {
      const response = await api.post("/auth/register.php", userData);
      return response.data;
    } catch (error) {
      // Axios throws for non-2xx; for expected validation errors, return the payload.
      if (error?.response?.data) {
        return error.response.data;
      }
      throw error;
    }
  },

  // Login user
  login: async (credentials) => {
    const response = await api.post("/auth/login.php", credentials);
    return response.data;
  },

  // Logout user
  logout: async () => {
    const response = await api.post("/auth/logout.php");
    return response.data;
  },

  // Verify session
  verifySession: async () => {
    const response = await api.get("/auth/verify-session.php");
    return response.data;
  },

  // Google Auth
  googleAuth: async (credential) => {
    const response = await api.post("/auth/google-auth.php", { credential });
    return response.data;
  },

  // Send verification code (supports both email and phone)
  sendVerificationCode: async (emailOrPhone) => {
    const isEmail = emailOrPhone.includes('@');
    const response = await api.post("/auth/send-verification-code.php", 
      isEmail ? { email: emailOrPhone } : { phone_number: emailOrPhone }
    );
    return response.data;
  },

  // Verify code (supports both email and phone)
  verifyCode: async (emailOrPhone, code) => {
    const isEmail = emailOrPhone.includes('@');
    const response = await api.post("/auth/verify-code.php", 
      isEmail ? { email: emailOrPhone, code: code } : { phone_number: emailOrPhone, code: code }
    );
    return response.data;
  },

  // Complete registration
  completeRegistration: async (userData) => {
    const response = await api.post(
      "/auth/complete-registration.php",
      userData
    );
    return response.data;
  },

  // Reset password
  resetPassword: async (email) => {
    const response = await api.post("/auth/reset-password.php", { 
      action: 'request',
      email 
    });
    return response.data;
  },

  // Change password
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post("/auth/change-password.php", {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  // Verify token and reset password (step 2)
  verifyAndResetPassword: async (token, newPassword) => {
    const response = await api.post("/auth/reset-password.php", {
      action: 'reset',
      token: token,
      new_password: newPassword,
    });
    return response.data;
  },
};
