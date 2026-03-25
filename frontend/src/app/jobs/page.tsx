'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import JobCard from '@/components/JobCard';
import api from '@/lib/api';

interface Job {
  id: number;
  linkedin_job_id: string;
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  remote_type: string;
  description: string;
  requirements: string;
  confidence_score: number;
  linkedin_match_score: number | null;
  status: string;
  score_breakdown: {
    title_score: number;
    skills_score: number;
    experience_score: number;
    salary_score: number;
    location_score: number;
    linkedin_score: number;
  } | null;
  job_url: string;
  created_at: string;
}

type SortOption = 'confidence' | 'salary' | 'recent';
type FilterOption = 'all' | 'pending' | 'approved' | 'rejected';

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('confidence');
  const [filterBy, setFilterBy] = useState<FilterOption>('all');
  const [applying, setApplying] = useState(false);

  const fetchJobs = useCallback(async () => {
    try {
      const response = await api.get('/jobs/daily');
      setJobs(response.data.jobs || []);
    } catch (error) {
      console.error('Failed to fetch jobs:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleApprove = async (jobId: number) => {
    try {
      await api.post(`/jobs/${jobId}/approve`);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'approved' } : j))
      );
    } catch (error) {
      console.error('Failed to approve job:', error);
    }
  };

  const handleReject = async (jobId: number) => {
    try {
      await api.post(`/jobs/${jobId}/reject`);
      setJobs((prev) =>
        prev.map((j) => (j.id === jobId ? { ...j, status: 'rejected' } : j))
      );
    } catch (error) {
      console.error('Failed to reject job:', error);
    }
  };

  const handleApplyAll = () => {
    const approvedJobs = jobs.filter((j) => j.status === 'approved');
    if (approvedJobs.length === 0) return;

    // Open each job's application URL in a new tab for the user to review and submit
    for (const job of approvedJobs) {
      if (job.job_url) {
        window.open(job.job_url, '_blank', 'noopener,noreferrer');
      }
    }
  };

  const handleManualSearch = async () => {
    setLoading(true);
    try {
      await api.post('/jobs/search', {});
      await fetchJobs();
    } catch (error) {
      console.error('Manual search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    if (filterBy === 'all') return true;
    return job.status === filterBy;
  });

  const sortedJobs = [...filteredJobs].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence_score - a.confidence_score;
      case 'salary':
        return (b.salary_max || 0) - (a.salary_max || 0);
      case 'recent':
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      default:
        return 0;
    }
  });

  const approvedCount = jobs.filter((j) => j.status === 'approved').length;

  return (
    <AuthGuard>
      <div className="pb-20">
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 pt-12 pb-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Today&apos;s Jobs
            </h1>
            <button
              onClick={handleManualSearch}
              disabled={loading}
              className="text-sm text-linkedin-blue font-medium disabled:opacity-50"
            >
              {loading ? 'Searching...' : 'Search'}
            </button>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar">
            {(['all', 'pending', 'approved', 'rejected'] as FilterOption[]).map(
              (filter) => (
                <button
                  key={filter}
                  onClick={() => setFilterBy(filter)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    filterBy === filter
                      ? 'bg-linkedin-blue text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                  }`}
                >
                  {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  {filter === 'all' && ` (${jobs.length})`}
                  {filter === 'pending' &&
                    ` (${jobs.filter((j) => j.status === 'pending').length})`}
                  {filter === 'approved' && ` (${approvedCount})`}
                  {filter === 'rejected' &&
                    ` (${jobs.filter((j) => j.status === 'rejected').length})`}
                </button>
              )
            )}
          </div>

          <div className="flex items-center justify-between mt-3">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="text-sm bg-gray-100 dark:bg-gray-800 border-0 rounded-lg px-3 py-1.5 text-gray-700 dark:text-gray-300"
            >
              <option value="confidence">Sort by Confidence</option>
              <option value="salary">Sort by Salary</option>
              <option value="recent">Sort by Recent</option>
            </select>

            {approvedCount > 0 && (
              <button
                onClick={handleApplyAll}
                disabled={applying}
                className="bg-green-500 hover:bg-green-600 text-white text-sm font-medium px-4 py-1.5 rounded-lg disabled:opacity-50 transition-colors"
              >
{`Open All (${approvedCount})`}
              </button>
            )}
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
          ) : sortedJobs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">
                No jobs found for today. Check back later or update your criteria.
              </p>
            </div>
          ) : (
            sortedJobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                onApprove={() => handleApprove(job.id)}
                onReject={() => handleReject(job.id)}
              />
            ))
          )}
        </div>
      </div>
      <Navigation />
    </AuthGuard>
  );
}
