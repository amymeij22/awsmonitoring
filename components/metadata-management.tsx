"use client"

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function MetadataManagement() {
  const [metadata, setMetadata] = useState<any[]>([])
  const [newMetadata, setNewMetadata] = useState({
    sta_name: '',
    wmo_code: '',
    sta_coordinate: '',
  })

  useEffect(() => {
    fetchMetadata()
  }, [])

  async function fetchMetadata() {
    const { data, error } = await supabase
      .from('metadata')
      .select('*')
    if (error) {
      console.error('Error fetching metadata:', error)
    } else {
      setMetadata(data)
    }
  }

  async function handleCreate() {
    const { data, error } = await supabase
      .from('metadata')
      .insert([newMetadata])
    if (error) {
      console.error('Error creating metadata:', error)
    } else {
      fetchMetadata()
      setNewMetadata({
        sta_name: '',
        wmo_code: '',
        sta_coordinate: '',
      })
    }
  }

  async function handleUpdate(id: number, updatedMetadata: any) {
    const { error } = await supabase
      .from('metadata')
      .update(updatedMetadata)
      .eq('id', id)
    if (error) {
      console.error('Error updating metadata:', error)
    } else {
      fetchMetadata()
    }
  }

  async function handleDelete(id: number) {
    const { error } = await supabase
      .from('metadata')
      .delete()
      .eq('id', id)
    if (error) {
      console.error('Error deleting metadata:', error)
    } else {
      fetchMetadata()
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata Management</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 grid grid-cols-3 gap-4">
          <Input
            placeholder="Station Name"
            value={newMetadata.sta_name}
            onChange={(e) => setNewMetadata({ ...newMetadata, sta_name: e.target.value })}
          />
          <Input
            placeholder="WMO Code"
            value={newMetadata.wmo_code}
            onChange={(e) => setNewMetadata({ ...newMetadata, wmo_code: e.target.value })}
          />
          <Input
            placeholder="Station Coordinates"
            value={newMetadata.sta_coordinate}
            onChange={(e) => setNewMetadata({ ...newMetadata, sta_coordinate: e.target.value })}
          />
          <Button onClick={handleCreate}>Create New Metadata</Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Station Name</TableHead>
              <TableHead>WMO Code</TableHead>
              <TableHead>Station Coordinates</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {metadata.map((item) => (
              <TableRow key={item.id}>
                <TableCell>{item.id}</TableCell>
                <TableCell>{item.sta_name}</TableCell>
                <TableCell>{item.wmo_code}</TableCell>
                <TableCell>{item.sta_coordinate}</TableCell>
                <TableCell>
                  <Button onClick={() => handleUpdate(item.id, item)}>Update</Button>
                  <Button onClick={() => handleDelete(item.id)}>Delete</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

