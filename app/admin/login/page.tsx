import { Metadata } from 'next'
import AdminLoginForm from '@/components/admin-login-form'

export const metadata: Metadata = {
  title: 'Admin Login - Monitoring Automatic Weather Station',
  description: 'Admin login page for the weather station monitoring system',
}

export default function AdminLoginPage() {
  return (
    <div className="container mx-auto flex items-center justify-center min-h-screen">
      <AdminLoginForm />
    </div>
  )
}

