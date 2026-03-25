'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';

interface Application {
  id: number;
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  remote_type: string;
  confidence_score: number;
  status: string;
  job_url: string;
  applied_at: string | null;
  error_message: string | null;
  created_at: string;
}

const STATUS_PIPELINE = ['approved', 'applying', 'applied', 'viewed', 'response'];

const STATUS_COLORS: Record<string, string> = {
  approved: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
  applying: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
  applied: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
  viewed: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
  response: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-300',
  error: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300',
};

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<string>('all');

  const fetchApplications = useCallback(async () => {
    try {
      const params = activeFilter !== 'all' ? `?status=${activeFilter}` : '';
      const response = await api.get(`/applications${params}`);
      setApplications(response.data.applications || []);
    } catch (error) {
      console.error('Failed to fetch applications:', error);
    } finally {
      setLoading(false);
    }
  }, [activeFilter]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const fmt = (v: number) => `$${(v / 1000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    if (max) return `Up to ${fmt(max)}`;
    return null;
  };

  const getStatusStep = (status: string) => {
    const index = STATUS_PIPELINE.indexOf(status);
    return index >= 0 ? index : -1;
  };

  return (
    <AuthGuard>
      <div className="pb-20">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            Applications
          </h1>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {['all', ...STATUS_PIPELINE, 'error'].map((filter) => (
              <button
                key={filter}
                onClick={() => {
                  setActiveFilter(filter);
                  setLoading(true);
                }}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  activeFilter === filter
                    ? 'bg-linkedin-blue text-white'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                }`}
              >
                {filter.charAt(0).toUpperCase() + filter.slice(1)}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 space-y-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 animate-pulse"
              >
                <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2" />
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
              </div>
            ))
          ) : applications.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No applications yet. Approve some jobs and start applying.
              </p>
            </div>
          ) : (
            applications.map((app) => {
              const statusStep = getStatusStep(app.status);
              const salary = formatSalary(app.salary_min, app.salary_max);

              return (
                <div
                  key={app.id}
                  className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
                        {app.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {app.company}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ml-2 flex-shrink-0 ${
                        STATUS_COLORS[app.status] || 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
                    {app.location && <span>{app.location}</span>}
                    {salary && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span>{salary}</span>
                      </>
                    )}
                    {app.remote_type !== 'onsite' && (
                      <>
                        <span className="w-1 h-1 rounded-full bg-gray-300" />
                        <span className="capitalize">{app.remote_type}</span>
                      </>
                    )}
                  </div>

                  {/* Status Pipeline */}
                  {app.status !== 'error' && (
                    <div className="flex items-center gap-1 mb-2">
                      {STATUS_PIPELINE.map((step, index) => (
                        <div key={step} className="flex items-center flex-1">
                          <div
                            className={`h-1.5 flex-1 rounded-full ${
                              index <= statusStep
                                ? 'bg-linkedin-blue'
                                : 'bg-gray-200 dark:bg-gray-700'
                            }`}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    {app.applied_at && (
                      <span>Applied {formatDate(app.applied_at)}</span>
                    )}
                    {!app.applied_at && app.created_at && (
                      <span>Added {formatDate(app.created_at)}</span>
                    )}
                    {app.job_url && (
                      <a
                        href={app.job_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-linkedin-blue font-medium"
                      >
                        View on LinkedIn
                      </a>
                    )}
                  </div>

                  {app.error_message && (
                    <div className="mt-2 text-xs text-red-500 bg-red-50 dark:bg-red-900/20 rounded-lg p-2">
                      {app.error_message}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
      <Navigation />
    </AuthGuard>
  );
}
