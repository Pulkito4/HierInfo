'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

export default function TestSupabase() {
  const [connected, setConnected] = useState<boolean | null>(null)
  const [message, setMessage] = useState<string>('')

  useEffect(() => {
    const testConnection = async () => {
      try {
        const { data, error } = await supabase
          .from('test_connection')
          .select('message')
          .limit(1)
          .single()
        
        if (error) {
          setConnected(false)
        } else {
          setConnected(true)
          setMessage(data?.message || '')
        }
      } catch (err) {
        setConnected(false)
      }
    }
    testConnection()
  }, [])

  return (
    <div className="p-4">
      <h2>Supabase Connection Test</h2>
      <p>Status: {connected === null ? 'Testing...' : connected ? '✅ Connected' : '❌ Failed'}</p>
      {message && <p>Message: {message}</p>}
    </div>
  )
}