// #region agent log
try {
  fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vite.config.js:1',message:'Config file loading',data:{nodeVersion:process.version},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'A'})}).catch(()=>{});
} catch(e) {}
// #endregion
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// #region agent log
try {
  fetch('http://127.0.0.1:7243/ingest/b59410d3-b4c0-4415-a721-a578a096f810',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'vite.config.js:4',message:'Imports successful',data:{hasDefineConfig:typeof defineConfig},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
} catch(e) {}
// #endregion

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})
