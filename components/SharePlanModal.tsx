'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import {
  fetchPlanMembers,
  invitePlanMember,
  removePlanMember,
  searchDirectory,
  type PlanMemberItem,
  type DirectoryUser,
} from '@/lib/api';

const DEBOUNCE_MS = 300;

interface SharePlanModalProps {
  planId: string | null;
  onClose: () => void;
}

function parseEmailFromDisplay(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/\(([^)]+)\)$/);
  if (match) return match[1].trim();
  if (trimmed.includes('@')) return trimmed;
  return trimmed;
}

export function SharePlanModal({ planId, onClose }: SharePlanModalProps) {
  const [members, setMembers] = useState<PlanMemberItem[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [selectedEmail, setSelectedEmail] = useState<string | null>(null);
  const [results, setResults] = useState<DirectoryUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (planId) {
      setError('');
      fetchPlanMembers(planId)
        .then(setMembers)
        .catch(() => setMembers([]));
    } else {
      setMembers([]);
    }
  }, [planId]);

  const runSearch = useCallback((q: string) => {
    if (q.trim().length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    setLoading(true);
    searchDirectory(q)
      .then((users) => {
        setResults(users);
        setDropdownOpen(users.length > 0);
      })
      .catch(() => setResults([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    const q = inputValue.trim();
    if (q.length < 2) {
      setResults([]);
      setDropdownOpen(false);
      return;
    }
    debounceRef.current = setTimeout(() => runSearch(q), DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [inputValue, runSearch]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const emailToInvite = selectedEmail ?? parseEmailFromDisplay(inputValue);
  const canInvite = Boolean(planId && emailToInvite.trim());

  const handleInvite = async () => {
    if (!planId || !emailToInvite.trim()) return;
    setError('');
    try {
      await invitePlanMember(planId, emailToInvite.trim().toLowerCase(), inviteRole);
      setInputValue('');
      setSelectedEmail(null);
      setResults([]);
      setDropdownOpen(false);
      const list = await fetchPlanMembers(planId);
      setMembers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to invite');
    }
  };

  const handleRemove = async (userId: string) => {
    if (!planId) return;
    setError('');
    try {
      await removePlanMember(planId, userId);
      const list = await fetchPlanMembers(planId);
      setMembers(list);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to remove');
    }
  };

  const handleSelect = (user: DirectoryUser) => {
    const mail = user.mail || '';
    setSelectedEmail(mail);
    setInputValue(user.displayName ? `${user.displayName} (${mail})` : mail);
    setResults([]);
    setDropdownOpen(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
    setSelectedEmail(null);
  };

  const handleClose = () => {
    setInputValue('');
    setSelectedEmail(null);
    setResults([]);
    setError('');
    onClose();
  };

  return (
    <Modal
      isOpen={!!planId}
      onClose={handleClose}
      title="Share plan"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Search by name or email to find someone, or type an email. Editors can edit the plan; viewers can only view.
        </p>
        <div className="flex gap-2 flex-wrap items-start" ref={containerRef}>
          <div className="relative flex-1 min-w-[200px]">
            <Input
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => inputValue.trim().length >= 2 && results.length > 0 && setDropdownOpen(true)}
              placeholder="Search name or email..."
              className="w-full"
              autoComplete="off"
            />
            {dropdownOpen && (
              <ul
                className="absolute z-50 mt-1 w-full max-h-56 overflow-auto rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#022943] shadow-lg py-1"
                role="listbox"
              >
                {loading ? (
                  <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">Searching...</li>
                ) : results.length === 0 ? (
                  <li className="px-3 py-2 text-sm text-slate-500 dark:text-slate-400">No people found</li>
                ) : (
                  results.map((user) => (
                    <li
                      key={user.id}
                      role="option"
                      className="px-3 py-2 text-sm cursor-pointer hover:bg-slate-100 dark:hover:bg-white/10 text-[#022943] dark:text-white"
                      onClick={() => handleSelect(user)}
                    >
                      <span className="font-medium">{user.displayName || user.mail || 'Unknown'}</span>
                      {user.displayName && user.mail && (
                        <span className="text-slate-500 dark:text-slate-400 ml-2">{user.mail}</span>
                      )}
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
            className="rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#022943] px-3 py-2 text-sm text-[#022943] dark:text-white"
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
          <Button variant="primary" onClick={handleInvite} disabled={!canInvite}>
            Invite
          </Button>
        </div>
        {error && <p className="text-sm text-[#ed1c24]">{error}</p>}
        <div>
          <p className="text-sm font-medium text-[#022943] dark:text-white mb-2">People with access</p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between text-sm py-1 border-b border-slate-200 dark:border-white/10">
                <span className="text-[#022943] dark:text-white">{m.name || m.email || m.userId}</span>
                <span className="flex items-center gap-2">
                  <span className="text-slate-500 dark:text-slate-400 capitalize">{m.role.toLowerCase()}</span>
                  {m.role !== 'OWNER' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-[#ed1c24] hover:bg-[#ed1c24]/10"
                      onClick={() => handleRemove(m.userId)}
                    >
                      Remove
                    </Button>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </Modal>
  );
}
