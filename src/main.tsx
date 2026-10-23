import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import AuthGate from './AuthGate.tsx'

// نقطه‌ی ورود برنامه: AuthGate ابتدا وضعیت ورود کاربر را بررسی می‌کند
// و فقط در صورت لاگین بودن، صفحه‌ی اصلی (App) را نمایش می‌دهد.
const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('المان #root در index.html پیدا نشد.')
}

createRoot(rootElement).render(
  <StrictMode>
    <AuthGate />
  </StrictMode>,
)
