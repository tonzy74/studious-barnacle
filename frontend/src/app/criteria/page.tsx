'use client';

import { useEffect, useState, useCallback } from 'react';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import api from '@/lib/api';

interface CriteriaData {
  target_titles: string[];
  min_salary_same_level: number | null;
  min_salary_step_up: number | null;
  location: string;
  max_office_days: number;
  remote_ok: boolean;
  hybrid_ok: boolean;
  excluded_industries: string[];
  excluded_companies: string[];
  daily_batch_size: number;
}

export default function CriteriaPage() {
  const [criteria, setCriteria] = useState<CriteriaData>({
    target_titles: [],
    min_salary_same_level: null,
    min_salary_step_up: null,
    location: '',
    max_office_days: 3,
    remote_ok: true,
    hybrid_ok: true,
    excluded_industries: [],
    excluded_companies: [],
    daily_batch_size: 10,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [industryInput, setIndustryInput] = useState('');
  const [companyInput, setCompanyInput] = useState('');

  const fetchCriteria = useCallback(async () => {
    try {
      const profileRes = await api.get('/profile');
      const location = profileRes.data.location || '';

      try {
        const res = await api.get('/jobs/history?status=pending&per_page=1');
        // If we get criteria from profile/criteria endpoint, use it
      } catch {
        // No criteria set yet
      }

      setCriteria((prev) => ({
        ...prev,
        location: prev.location || location,
      }));
    } catch (error) {
      console.error('Failed to fetch criteria:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCriteria();
  }, [fetchCriteria]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await api.put('/profile/criteria', criteria);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to save criteria:', error);
    } finally {
      setSaving(false);
    }
  };

  const addTitle = () => {
    const trimmed = titleInput.trim();
    if (trimmed && !criteria.target_titles.includes(trimmed)) {
      setCriteria((prev) => ({
        ...prev,
        target_titles: [...prev.target_titles, trimmed],
      }));
      setTitleInput('');
    }
  };

  const removeTitle = (title: string) => {
    setCriteria((prev) => ({
      ...prev,
      target_titles: prev.target_titles.filter((t) => t !== title),
    }));
  };

  const addIndustry = () => {
    const trimmed = industryInput.trim();
    if (trimmed && !criteria.excluded_industries.includes(trimmed)) {
      setCriteria((prev) => ({
        ...prev,
        excluded_industries: [...prev.excluded_industries, trimmed],
      }));
      setIndustryInput('');
    }
  };

  const removeIndustry = (industry: string) => {
    setCriteria((prev) => ({
      ...prev,
      excluded_industries: prev.excluded_industries.filter((i) => i !== industry),
    }));
  };

  const addCompany = () => {
    const trimmed = companyInput.trim();
    if (trimmed && !criteria.excluded_companies.includes(trimmed)) {
      setCriteria((prev) => ({
        ...prev,
        excluded_companies: [...prev.excluded_companies, trimmed],
      }));
      setCompanyInput('');
    }
  };

  const removeCompany = (company: string) => {
    setCriteria((prev) => ({
      ...prev,
      excluded_companies: prev.excluded_companies.filter((c) => c !== company),
    }));
  };

  const formatSalary = (value: number | null) => {
    if (value === null) return '';
    return `$${(value / 1000).toFixed(0)}K`;
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
      <div className="pb-24">
        <div className="px-6 pt-12 pb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Search Criteria
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Define what you are looking for in your next role
          </p>
        </div>

        <div className="px-6 space-y-6">
          {/* Target Titles */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Target Job Titles
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={titleInput}
                onChange={(e) => setTitleInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTitle())}
                placeholder="e.g. Senior Software Engineer"
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500"
              />
              <button
                onClick={addTitle}
                className="bg-brand-blue text-white px-4 py-3 rounded-xl text-sm font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {criteria.target_titles.map((title) => (
                <span
                  key={title}
                  className="inline-flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm"
                >
                  {title}
                  <button
                    onClick={() => removeTitle(title)}
                    className="text-blue-600 dark:text-blue-300 hover:text-blue-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Salary Ranges */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Salary (Same Level)
              </label>
              <input
                type="range"
                min="0"
                max="500000"
                step="5000"
                value={criteria.min_salary_same_level || 0}
                onChange={(e) =>
                  setCriteria((prev) => ({
                    ...prev,
                    min_salary_same_level: parseInt(e.target.value) || null,
                  }))
                }
                className="w-full accent-brand-blue"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatSalary(criteria.min_salary_same_level) || 'Not set'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Min Salary (Step Up)
              </label>
              <input
                type="range"
                min="0"
                max="500000"
                step="5000"
                value={criteria.min_salary_step_up || 0}
                onChange={(e) =>
                  setCriteria((prev) => ({
                    ...prev,
                    min_salary_step_up: parseInt(e.target.value) || null,
                  }))
                }
                className="w-full accent-brand-blue"
              />
              <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {formatSalary(criteria.min_salary_step_up) || 'Not set'}
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Location
            </label>
            <input
              type="text"
              value={criteria.location}
              onChange={(e) =>
                setCriteria((prev) => ({ ...prev, location: e.target.value }))
              }
              placeholder="Auto-populated from profile"
              className="w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500"
            />
          </div>

          {/* Remote / Hybrid Toggles */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Remote OK
              </label>
              <button
                onClick={() =>
                  setCriteria((prev) => ({ ...prev, remote_ok: !prev.remote_ok }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  criteria.remote_ok ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    criteria.remote_ok ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Hybrid OK
              </label>
              <button
                onClick={() =>
                  setCriteria((prev) => ({ ...prev, hybrid_ok: !prev.hybrid_ok }))
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  criteria.hybrid_ok ? 'bg-brand-blue' : 'bg-gray-300 dark:bg-gray-600'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    criteria.hybrid_ok ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Max Office Days */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Max Office Days per Week
            </label>
            <input
              type="range"
              min="0"
              max="5"
              step="1"
              value={criteria.max_office_days}
              onChange={(e) =>
                setCriteria((prev) => ({
                  ...prev,
                  max_office_days: parseInt(e.target.value),
                }))
              }
              className="w-full accent-brand-blue"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0 (Full Remote)</span>
              <span className="font-medium text-brand-blue">
                {criteria.max_office_days} days
              </span>
              <span>5 (Full Onsite)</span>
            </div>
          </div>

          {/* Excluded Industries */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excluded Industries
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={industryInput}
                onChange={(e) => setIndustryInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addIndustry())
                }
                placeholder="e.g. Gambling"
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500"
              />
              <button
                onClick={addIndustry}
                className="bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {criteria.excluded_industries.map((industry) => (
                <span
                  key={industry}
                  className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm"
                >
                  {industry}
                  <button
                    onClick={() => removeIndustry(industry)}
                    className="text-red-600 dark:text-red-300 hover:text-red-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Excluded Companies */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Excluded Companies
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={companyInput}
                onChange={(e) => setCompanyInput(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && (e.preventDefault(), addCompany())
                }
                placeholder="e.g. Company Name"
                className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white placeholder-gray-500"
              />
              <button
                onClick={addCompany}
                className="bg-red-500 text-white px-4 py-3 rounded-xl text-sm font-medium"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {criteria.excluded_companies.map((company) => (
                <span
                  key={company}
                  className="inline-flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-3 py-1 rounded-full text-sm"
                >
                  {company}
                  <button
                    onClick={() => removeCompany(company)}
                    className="text-red-600 dark:text-red-300 hover:text-red-800"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Daily Batch Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Daily Batch Size
            </label>
            <select
              value={criteria.daily_batch_size}
              onChange={(e) =>
                setCriteria((prev) => ({
                  ...prev,
                  daily_batch_size: parseInt(e.target.value),
                }))
              }
              className="w-full bg-gray-100 dark:bg-gray-800 border-0 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-white"
            >
              {[5, 10, 15, 20, 25, 30].map((size) => (
                <option key={size} value={size}>
                  {size} jobs per day
                </option>
              ))}
            </select>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className={`w-full py-3.5 rounded-xl font-semibold text-white transition-colors ${
              saved
                ? 'bg-green-500'
                : 'bg-brand-blue hover:bg-brand-dark disabled:opacity-50'
            }`}
          >
            {saving ? 'Saving...' : saved ? 'Saved Successfully' : 'Save Criteria'}
          </button>
        </div>
      </div>
      <Navigation />
    </AuthGuard>
  );
}
