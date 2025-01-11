"use client"

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ThemeToggle } from "@/components/theme-toggle"
import AWSDataManagement from '@/components/aws-data-management'
import UserManagement from '@/components/user-management'
import MetadataManagement from '@/components/metadata-management'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AdminDashboard() {
  const [user, setUser] = useState<any>(null)
  const router = useRouter()

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
      } else {
        router.push('/admin/login')
      }
    }
    fetchUser()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div>
      <header className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button onClick={handleLogout}>Logout</Button>
        </div>
      </header>

      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Login Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Email: {user.email}</p>
        </CardContent>
      </Card>

      <Tabs defaultValue="aws-data">
        <TabsList>
          <TabsTrigger value="aws-data">AWS Data Management</TabsTrigger>
          <TabsTrigger value="users">User Management</TabsTrigger>
          <TabsTrigger value="metadata">Metadata</TabsTrigger>
        </TabsList>
        <TabsContent value="aws-data">
          <AWSDataManagement />
        </TabsContent>
        <TabsContent value="users">
          <UserManagement />
        </TabsContent>
        <TabsContent value="metadata">
          <MetadataManagement />
        </TabsContent>
      </Tabs>
    </div>
  )
}

