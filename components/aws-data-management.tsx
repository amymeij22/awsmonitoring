"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/components/ui/use-toast"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

const timeRanges: Record<string, { hours?: number; days?: number; months?: number } | null> = {
  '1h': { hours: 1 },
  '24h': { hours: 24 },
  '7d': { days: 7 },
  '1m': { months: 1 },
  'all': null
}

export default function AWSDataManagement() {
  const [data, setData] = useState<any[]>([])
  const [timeRange, setTimeRange] = useState('24h')
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deletePassword, setDeletePassword] = useState('')
  const [deleteConfirmation, setDeleteConfirmation] = useState('')
  const { toast } = useToast()

  useEffect(() => {
    fetchData(timeRange)
  }, [timeRange])

  async function fetchData(range: string) {
    let query = supabase
      .from('awsdata')
      .select('*')
      .order('created_at', { ascending: true })

    const timeRange = timeRanges[range]
    if (timeRange) {
      const { hours, days, months } = timeRange
      const now = new Date()
      let startDate = new Date()
      if (hours) startDate.setHours(now.getHours() - hours)
      if (days) startDate.setDate(now.getDate() - days)
      if (months) startDate.setMonth(now.getMonth() - months)
      
      query = query.gte('created_at', startDate.toISOString())
    }

    const { data, error } = await query
    if (error) {
      console.error('Error fetching data:', error)
    } else {
      setData(data)
    }
  }

  async function handleDeleteAllData() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Verify password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: deletePassword
    })

    if (signInError) {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Incorrect password"
      })
      return
    }

    if (deleteConfirmation !== "delete all data") {
      toast({
        variant: "destructive",
        title: "Verification Failed",
        description: "Confirmation text does not match"
      })
      return
    }

    const { error: deleteError } = await supabase
      .from('awsdata')
      .delete()
      .neq('id', 0) // Delete all rows

    if (deleteError) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete data"
      })
    } else {
      toast({
        title: "Success",
        description: "All data has been deleted"
      })
      setShowDeleteDialog(false)
      fetchData(timeRange)
    }
  }

  const metrics = [
    { key: 'temp', name: 'Temperature', unit: '°C' },
    { key: 'rh', name: 'Humidity', unit: '%' },
    { key: 'wind_direction', name: 'Wind Direction', unit: '°' },
    { key: 'wind_speed', name: 'Wind Speed', unit: 'm/s' },
    { key: 'pressure', name: 'Pressure', unit: 'hPa' },
    { key: 'radiation', name: 'Radiation', unit: 'W/m²' },
    { key: 'precipitation', name: 'Precipitation', unit: 'mm' }
  ]

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select time range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1h">Last Hour</SelectItem>
            <SelectItem value="24h">Last 24 Hours</SelectItem>
            <SelectItem value="7d">Last 7 Days</SelectItem>
            <SelectItem value="1m">Last Month</SelectItem>
            <SelectItem value="all">All Time</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="destructive"
          onClick={() => setShowDeleteDialog(true)}
        >
          Delete All Data
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {metrics.map((metric) => (
          <Card key={metric.key}>
            <CardHeader>
              <CardTitle>{metric.name}</CardTitle>
            </CardHeader>
            <CardContent className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="created_at"
                    tickFormatter={(value) => new Date(value).toLocaleTimeString()}
                  />
                  <YAxis />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleString()}
                    formatter={(value) => [`${value}${metric.unit}`, metric.name]}
                  />
                  <Line
                    type="monotone"
                    dataKey={metric.key}
                    stroke="#8884d8"
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete All Data</DialogTitle>
            <DialogDescription>
              This action cannot be undone. Please verify your identity and confirm deletion.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Admin Password</Label>
              <Input
                id="password"
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmation">
                Type "delete all data" to confirm
              </Label>
              <Input
                id="confirmation"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDeleteAllData}>
              Delete All Data
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

