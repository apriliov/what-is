import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// In development the chat page talks to ws://<this host>/chat-ws, which is forwarded to the
// local chat server (see chat-server/). In production set VITE_CHAT_WS_URL instead.
const chatProxy = { '/chat-ws': { target: 'ws://localhost:8787', ws: true } }

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: { proxy: chatProxy },
  preview: { proxy: chatProxy },
})
