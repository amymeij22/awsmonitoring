import { Metadata } from 'next'
import MainPage from '@/components/main-page'

export const metadata: Metadata = {
  title: 'Monitoring Automatic Weather Station',
  description: 'Main page for monitoring automatic weather station data',
}

export default function Home() {
  return (
    <main>
      <MainPage />
    </main>
  )
}

