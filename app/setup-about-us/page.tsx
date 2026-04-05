'use client';

import { useState } from 'react';
import { createSupabaseAnon } from '@/lib/supabase';

export default function SetupAboutUs() {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const runSetup = async () => {
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/setup-about-us', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.message || 'Setup completed successfully!');
      } else {
        setError(data.error || 'Setup failed');
      }
    } catch (err) {
      setError('Network error during setup');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-gray-800 rounded-lg p-6 space-y-4">
        <h1 className="text-2xl font-bold text-center">Setup About Us CMS</h1>
        
        <div className="text-sm text-gray-400">
          <p>This will create the necessary database table for the About Us CMS.</p>
          <p className="mt-2">If the table already exists, this will do nothing.</p>
        </div>

        {message && (
          <div className="p-3 bg-green-900/50 border border-green-500 rounded text-green-400 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-900/50 border border-red-500 rounded text-red-400 text-sm">
            {error}
          </div>
        )}

        <button
          onClick={runSetup}
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white py-2 px-4 rounded transition-colors"
        >
          {loading ? 'Setting up...' : 'Setup About Us Table'}
        </button>

        <div className="text-xs text-gray-500 pt-4 border-t border-gray-700">
          <p className="mb-2">Manual SQL (if setup fails):</p>
          <pre className="bg-gray-900 p-2 rounded overflow-x-auto text-xs">
            {`-- Copy this SQL and run in Supabase SQL Editor:
CREATE TABLE about_us (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  subtitle TEXT DEFAULT 'QUIÉNES SOMOS_',
  description TEXT DEFAULT '',
  main_photo_url TEXT,
  gallery_photos TEXT[] DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO about_us (subtitle, description) 
VALUES ('QUIÉNES SOMOS_', 'Manso Club es un club creativo...');`}
          </pre>
        </div>
      </div>
    </div>
  );
}
