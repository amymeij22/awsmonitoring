import { Metadata } from 'next'
import AdminDashboard from '@/components/admin-dashboard'

export const metadata: Metadata = {
  title: 'Admin Dashboard - Monitoring Automatic Weather Station',
  description: 'Admin dashboard for managing weather station data and users',
}

export default function AdminDashboardPage() {
  return (
    <div className="container mx-auto p-4">
      <AdminDashboard />
    </div>
  )
}

