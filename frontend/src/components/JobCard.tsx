'use client';

import { useState } from 'react';
import ConfidenceScore from './ConfidenceScore';

interface ScoreBreakdown {
  title_score: number;
  skills_score: number;
  experience_score: number;
  salary_score: number;
  location_score: number;
}

interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  salary_min: number | null;
  salary_max: number | null;
  remote_type: string;
  description: string;
  confidence_score: number;
  status: string;
  score_breakdown: ScoreBreakdown | null;
  job_url: string;
  source?: string;
}

const SOURCE_ATTRIBUTION: Record<string, { label: string; url: string }> = {
  remoteok: { label: 'Remote OK', url: 'https://remoteok.com' },
  arbeitnow: { label: 'Arbeitnow', url: 'https://www.arbeitnow.com' },
  themuse: { label: 'The Muse', url: 'https://www.themuse.com' },
};

interface JobCardProps {
  job: Job;
  onApprove: () => void;
  onReject: () => void;
}

export default function JobCard({ job, onApprove, onReject }: JobCardProps) {
  const [expanded, setExpanded] = useState(false);

  const formatSalary = (min: number | null, max: number | null) => {
    if (!min && !max) return null;
    const fmt = (v: number) => `$${(v / 1000).toFixed(0)}K`;
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min) return `${fmt(min)}+`;
    if (max) return `Up to ${fmt(max)}`;
    return null;
  };

  const remoteBadgeColor = {
    remote: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
    hybrid: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
    onsite: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
  };

  const salary = formatSalary(job.salary_min, job.salary_max);
  const isActionable = job.status === 'pending' || job.status === 'approved' || job.status === 'rejected';

  const breakdownLabels: Record<string, string> = {
    title_score: 'Title Match',
    skills_score: 'Skills',
    experience_score: 'Experience',
    salary_score: 'Salary',
    location_score: 'Location',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
      <div className="p-4">
        <div className="flex items-start gap-3">
          <ConfidenceScore score={job.confidence_score} size={56} />

          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm leading-tight">
              {job.title}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              {job.company}
            </p>

            <div className="flex items-center flex-wrap gap-2 mt-2">
              {job.location && (
                <span className="text-xs text-gray-500">{job.location}</span>
              )}
              {salary && (
                <span className="text-xs font-medium text-green-600 dark:text-green-400">
                  {salary}
                </span>
              )}
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  remoteBadgeColor[job.remote_type as keyof typeof remoteBadgeColor] ||
                  remoteBadgeColor.onsite
                }`}
              >
                {job.remote_type.charAt(0).toUpperCase() + job.remote_type.slice(1)}
              </span>

            </div>
          </div>
        </div>

        {/* Expandable Details */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-center gap-1 mt-3 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          {expanded ? 'Hide Details' : 'Show Details'}
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {expanded && (
          <div className="mt-3 space-y-3">
            {/* Score Breakdown */}
            {job.score_breakdown && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                  Score Breakdown
                </h4>
                {Object.entries(job.score_breakdown).map(([key, value]) => {
                  if (key === 'overall') return null;
                  const label = breakdownLabels[key] || key;
                  const barColor =
                    value >= 80
                      ? 'bg-green-500'
                      : value >= 60
                      ? 'bg-yellow-500'
                      : value >= 40
                      ? 'bg-orange-500'
                      : 'bg-red-500';

                  return (
                    <div key={key} className="flex items-center gap-2">
                      <span className="text-xs text-gray-500 w-20 flex-shrink-0">
                        {label}
                      </span>
                      <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${barColor}`}
                          style={{ width: `${value}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500 w-8 text-right">
                        {Math.round(value)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Description */}
            {job.description && (
              <div>
                <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide mb-1">
                  Description
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-4">
                  {job.description}
                </p>
              </div>
            )}

            {job.job_url && (
              <a
                href={job.job_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-brand-blue font-medium"
              >
                View Posting
              </a>
            )}

            {/* Source attribution (required by API terms) */}
            {job.source && SOURCE_ATTRIBUTION[job.source] && (
              <p className="text-xs text-gray-400 mt-1">
                via{' '}
                <a
                  href={SOURCE_ATTRIBUTION[job.source].url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline hover:text-gray-600"
                >
                  {SOURCE_ATTRIBUTION[job.source].label}
                </a>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {isActionable && (
        <div className="flex border-t border-gray-100 dark:border-gray-700">
          <button
            onClick={onReject}
            disabled={job.status === 'rejected'}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              job.status === 'rejected'
                ? 'bg-red-50 dark:bg-red-900/20 text-red-400 cursor-default'
                : 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20'
            }`}
          >
            {job.status === 'rejected' ? 'Rejected' : 'Reject'}
          </button>
          <div className="w-px bg-gray-100 dark:bg-gray-700" />
          {job.status === 'approved' && job.job_url ? (
            <a
              href={job.job_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 text-sm font-medium text-center text-white bg-brand-blue hover:bg-brand-dark transition-colors"
            >
              Apply
            </a>
          ) : (
            <button
              onClick={onApprove}
              disabled={job.status === 'approved'}
              className={`flex-1 py-3 text-sm font-medium transition-colors ${
                job.status === 'approved'
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-400 cursor-default'
                  : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              {job.status === 'approved' ? 'Approved' : 'Approve'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
