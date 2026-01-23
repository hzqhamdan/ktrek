import api from "./index";

export const qrAPI = {
  // Verify scanned QR code
  verifyQR: async (qrCode) => {
    const response = await api.post("/qr/verify-qr.php", {
      qr_code: qrCode,
    });
    return response.data;
  },
};
