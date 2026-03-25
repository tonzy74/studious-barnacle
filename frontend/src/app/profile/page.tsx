'use client';

import { useEffect, useState } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';

interface ProfileData {
  name: string;
  email: string;
  headline: string;
  location: string;
  picture: string;
  about: string;
  experience: Array<{
    title: string;
    company: string;
    duration: string;
    description: string;
  }>;
  skills: string[];
  education: Array<{
    school: string;
    degree: string;
    dates: string;
  }>;
  certifications: Array<{
    name: string;
    issuer: string;
  }>;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await api.get('/profile');
        setProfile(response.data);
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/profile/sync');
      const response = await api.get('/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Profile sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Continue with client-side logout even if API fails
    }
    const { removeToken } = await import('@/lib/auth');
    removeToken();
    window.location.href = '/';
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-blue" />
        </div>
        <Navigation />
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="pb-20">
        {/* Profile Header */}
        <div className="bg-brand-blue px-6 pt-12 pb-8 rounded-b-3xl text-center">
          <div className="w-20 h-20 rounded-full bg-white/20 mx-auto flex items-center justify-center overflow-hidden">
            {profile?.picture ? (
              <img
                src={profile.picture}
                alt={profile.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-white font-bold">
                {profile?.name?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <h1 className="text-white text-xl font-bold mt-3">
            {profile?.name || 'Unknown'}
          </h1>
          {profile?.headline && (
            <p className="text-white/80 text-sm mt-1">{profile.headline}</p>
          )}
          {profile?.location && (
            <p className="text-white/60 text-xs mt-1">{profile.location}</p>
          )}
          {profile?.email && (
            <p className="text-white/60 text-xs mt-1">{profile.email}</p>
          )}
        </div>

        <div className="px-6 py-4 space-y-6">
          {/* Sync Button */}
          <button
            onClick={handleSync}
            disabled={syncing}
            className="w-full flex items-center justify-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl py-3 text-brand-blue font-medium shadow-sm disabled:opacity-50"
          >
            <svg
              className={`w-5 h-5 ${syncing ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
            {syncing ? 'Syncing...' : 'Update Profile'}
          </button>

          {/* About */}
          {profile?.about && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                About
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                {profile.about}
              </p>
            </div>
          )}

          {/* Experience */}
          {profile?.experience && profile.experience.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Experience
              </h2>
              <div className="space-y-4">
                {profile.experience.map((exp, index) => (
                  <div
                    key={index}
                    className="relative pl-6 border-l-2 border-brand-blue/30"
                  >
                    <div className="absolute -left-[5px] top-1 w-2 h-2 rounded-full bg-brand-blue" />
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {exp.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {exp.company}
                    </p>
                    {exp.duration && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {exp.duration}
                      </p>
                    )}
                    {exp.description && (
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                        {exp.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Skills
              </h2>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1 rounded-full text-sm"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Education */}
          {profile?.education && profile.education.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Education
              </h2>
              <div className="space-y-3">
                {profile.education.map((edu, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {edu.school}
                    </h3>
                    {edu.degree && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {edu.degree}
                      </p>
                    )}
                    {edu.dates && (
                      <p className="text-xs text-gray-500 mt-0.5">{edu.dates}</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Certifications */}
          {profile?.certifications && profile.certifications.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Certifications
              </h2>
              <div className="space-y-3">
                {profile.certifications.map((cert, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700">
                    <h3 className="font-medium text-gray-900 dark:text-white text-sm">
                      {cert.name}
                    </h3>
                    {cert.issuer && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {cert.issuer}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="w-full py-3 text-red-500 font-medium rounded-xl border border-red-200 dark:border-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
      <Navigation />
    </AuthGuard>
  );
}
