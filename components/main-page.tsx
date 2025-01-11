"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ThemeToggle } from "@/components/theme-toggle"
import mqtt from 'mqtt'


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl!, supabaseKey!)

export default function MainPage() {
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [latestData, setLatestData] = useState<any>(null)
  const [metadata, setMetadata] = useState<any>(null)

  useEffect(() => {
    fetchInitialData()

    // Setup MQTT connection
    const brokerUrl = process.env.NEXT_PUBLIC_HIVEMQ_WEBSOCKET_URL;
    const username = process.env.NEXT_PUBLIC_HIVEMQ_USERNAME;
    const password = process.env.NEXT_PUBLIC_HIVEMQ_PASSWORD;
    
    const client = mqtt.connect(brokerUrl!, {
      username: username,
      password: password,
      clean: true,
      reconnectPeriod: 1000,
    })
    
    client.on('connect', function () {
      console.log('Connected to Logger')
      client.subscribe('awsData', function (err) {
        if (err) {
        } else {
        }
      })
    })
    
    client.on('message', async function (topic, message) {
      console.log('Received message:', message.toString())
      const data = JSON.parse(message.toString())

      // Format the data
      const formattedData = {
        temp: data.Temp || null,
        rh: data.Rh || null,
        wind_direction: data['wind.Direction'] || null,
        wind_speed: data['wind.Speed'] || null,
        pressure: data.pressure || null,
        radiation: data.radiation || null,
        precipitation: data.precipitation || null,
      }

      // Update the latest data received via MQTT
      setLatestData(formattedData)
      setLastUpdate(new Date().toLocaleString())

      // Store the data in Supabase
      const { data: insertedData, error } = await supabase
        .from('awsdata')
        .insert([
          {
            temp: formattedData.temp,
            rh: formattedData.rh,
            wind_direction: formattedData.wind_direction,
            wind_speed: formattedData.wind_speed,
            pressure: formattedData.pressure,
            radiation: formattedData.radiation,
            precipitation: formattedData.precipitation,
            created_at: new Date().toISOString(),
          },
        ])

      if (error) {
        console.error('Error storing data', error)
      } else {
        console.log('Data stored', insertedData)
      }
    })

    // Clean up the MQTT connection on unmount
    return () => {
      client.end()
    }
  }, [])

  async function fetchInitialData() {
    const { data: awsData, error: awsError } = await supabase
      .from('awsdata')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (awsError) {
      console.error('Error fetching AWS data:', awsError)
    } else {
      setLastUpdate(awsData.created_at)
      setLatestData(awsData)
    }

    const { data: metaData, error: metaError } = await supabase
      .from('metadata')
      .select('*')
      .limit(1)
      .single()

    if (metaError) {
      console.error('Error fetching metadata:', metaError)
    } else {
      setMetadata(metaData)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-4 space-y-6">
        <header className="flex justify-between items-center py-6 border-b">
          <h1 className="text-4xl font-bold tracking-tight">Monitoring Automatic Weather Station</h1>
          <ThemeToggle />
        </header>

        {lastUpdate && (
          <div className="text-lg text-muted-foreground">
            Last update: {new Date(lastUpdate).toLocaleString()}
          </div>
        )}

        {latestData && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <WeatherCard title="Temperature" value={`${latestData.temp}°C`} />
            <WeatherCard title="Humidity" value={`${latestData.rh}%`} />
            <WeatherCard title="Wind Direction" value={`${latestData.wind_direction}°`} />
            <WeatherCard title="Wind Speed" value={`${latestData.wind_speed} m/s`} />
            <WeatherCard title="Pressure" value={`${latestData.pressure} hPa`} />
            <WeatherCard title="Radiation" value={`${latestData.radiation} W/m²`} />
            <WeatherCard title="Precipitation" value={`${latestData.precipitation} mm`} />
          </div>
        )}

        {metadata && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Station Name</p>
                  <p className="font-medium">{metadata.sta_name}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">WMO Code</p>
                  <p className="font-medium">{metadata.wmo_code}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">Station Coordinates</p>
                  <p className="font-medium">{metadata.sta_coordinate}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <footer className="py-6 border-t mt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {new Date().getFullYear()} {metadata?.sta_name || 'Weather Station'}. All rights reserved.
          </p>
        </footer>
      </div>
    </div>
  )
}

function WeatherCard({ title, value }: { title: string; value: string }) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}
  