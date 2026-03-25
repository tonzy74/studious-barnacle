'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';

interface DashboardData {
  profile: {
    name: string;
    headline: string;
    location: string;
    picture: string;
  };
  dailyJobCount: number;
  pendingApprovals: number;
  totalApplied: number;
  totalApproved: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      try {
        const [profileRes, dailyRes, applicationsRes] = await Promise.all([
          api.get('/profile'),
          api.get('/jobs/daily'),
          api.get('/applications'),
        ]);

        const profile = profileRes.data;
        const dailyJobs = dailyRes.data;
        const applications = applicationsRes.data;

        const pendingCount = dailyJobs.jobs?.filter(
          (j: { status: string }) => j.status === 'pending'
        ).length || 0;

        const approvedCount = dailyJobs.jobs?.filter(
          (j: { status: string }) => j.status === 'approved'
        ).length || 0;

        const appliedCount = applications.applications?.filter(
          (a: { status: string }) => a.status === 'applied'
        ).length || 0;

        setData({
          profile: {
            name: profile.name || '',
            headline: profile.headline || '',
            location: profile.location || '',
            picture: profile.picture || '',
          },
          dailyJobCount: dailyJobs.count || 0,
          pendingApprovals: pendingCount,
          totalApplied: appliedCount,
          totalApproved: approvedCount,
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchDashboard();
  }, []);

  return (
    <AuthGuard>
      <div className="pb-20">
        <div className="bg-brand-blue px-6 pt-12 pb-8 rounded-b-3xl">
          <h2 className="text-white/80 text-sm font-medium">Welcome back</h2>
          {loading ? (
            <div className="h-8 bg-white/20 rounded w-48 mt-1 animate-pulse" />
          ) : (
            <h1 className="text-white text-2xl font-bold mt-1">
              {data?.profile.name || 'User'}
            </h1>
          )}
          {!loading && data?.profile.headline && (
            <p className="text-white/70 text-sm mt-1">{data.profile.headline}</p>
          )}
          {!loading && data?.profile.location && (
            <p className="text-white/60 text-xs mt-1">{data.profile.location}</p>
          )}
        </div>

        <div className="px-6 -mt-4">
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => router.push('/jobs')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left"
            >
              <div className="text-3xl font-bold text-brand-blue">
                {loading ? '-' : data?.dailyJobCount || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Today&apos;s Jobs
              </div>
            </button>

            <button
              onClick={() => router.push('/jobs')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left"
            >
              <div className="text-3xl font-bold text-amber-500">
                {loading ? '-' : data?.pendingApprovals || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Pending Review
              </div>
            </button>

            <button
              onClick={() => router.push('/applications')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left"
            >
              <div className="text-3xl font-bold text-green-500">
                {loading ? '-' : data?.totalApproved || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Approved
              </div>
            </button>

            <button
              onClick={() => router.push('/applications')}
              className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 text-left"
            >
              <div className="text-3xl font-bold text-blue-500">
                {loading ? '-' : data?.totalApplied || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Applied
              </div>
            </button>
          </div>

          <div className="mt-6 space-y-3">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Quick Actions
            </h3>
            <button
              onClick={() => router.push('/jobs')}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Review Today&apos;s Jobs</div>
                <div className="text-sm text-gray-500">Approve or reject matched positions</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/criteria')}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Update Criteria</div>
                <div className="text-sm text-gray-500">Refine your job search preferences</div>
              </div>
            </button>

            <button
              onClick={() => router.push('/profile')}
              className="w-full flex items-center gap-4 bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="text-left">
                <div className="font-medium text-gray-900 dark:text-white">Update Profile</div>
                <div className="text-sm text-gray-500">Update your profile information</div>
              </div>
            </button>
          </div>
        </div>
      </div>
      <Navigation />
    </AuthGuard>
  );
}
