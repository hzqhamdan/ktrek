import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  // Load all env vars (no prefix filter) so we can drive Vite config from `.env`
  const env = loadEnv(mode, process.cwd(), '')

  // When developing through an HTTPS tunnel (cloudflared/ngrok), the browser connects
  // to the dev server via 443 and HMR must use that port (and typically wss).
  // For local dev, forcing port 443 causes the "ws://localhost:443" failure you saw.
  const useTunnelHmr = env.VITE_USE_TUNNEL_HMR === 'true'

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 5173,
      host: true, // Allow access from network (mobile devices)
      allowedHosts: [
        'localhost',
        '.trycloudflare.com', // Allow all cloudflare tunnel domains
        '.ngrok.io', // Allow ngrok tunnels
        '.local', // Allow local domains
      ],
      ...(useTunnelHmr
        ? {
            hmr: {
              // For tunnels, HMR needs to use the public 443 port
              clientPort: Number(env.VITE_HMR_CLIENT_PORT || 443),
              protocol: env.VITE_HMR_PROTOCOL || 'wss',
            },
          }
        : {}),
    },
  }
})
