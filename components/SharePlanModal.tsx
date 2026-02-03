'use client';

import { useEffect, useState } from 'react';
import { Modal } from '@/components/UI/Modal';
import { Input } from '@/components/UI/Input';
import { Button } from '@/components/UI/Button';
import { fetchPlanMembers, invitePlanMember, removePlanMember, type PlanMemberItem } from '@/lib/api';

interface SharePlanModalProps {
  planId: string | null;
  onClose: () => void;
}

export function SharePlanModal({ planId, onClose }: SharePlanModalProps) {
  const [members, setMembers] = useState<PlanMemberItem[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'EDITOR' | 'VIEWER'>('VIEWER');
  const [error, setError] = useState('');

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

  const handleInvite = async () => {
    if (!planId || !inviteEmail.trim()) return;
    setError('');
    try {
      await invitePlanMember(planId, inviteEmail.trim(), inviteRole);
      setInviteEmail('');
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

  const handleClose = () => {
    setInviteEmail('');
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
        <p className="text-sm text-muted-foreground">
          Invite someone by their work email (they must have signed in at least once). Editors can edit the plan; viewers can only view.
        </p>
        <div className="flex gap-2 flex-wrap">
          <Input
            type="email"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="colleague@seddon.co.uk"
            className="flex-1 min-w-[200px]"
          />
          <select
            value={inviteRole}
            onChange={(e) => setInviteRole(e.target.value as 'EDITOR' | 'VIEWER')}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="VIEWER">Viewer</option>
            <option value="EDITOR">Editor</option>
          </select>
          <Button variant="primary" onClick={handleInvite} disabled={!inviteEmail.trim()}>
            Invite
          </Button>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <div>
          <p className="text-sm font-medium text-foreground mb-2">People with access</p>
          <ul className="space-y-2 max-h-48 overflow-y-auto">
            {members.map((m) => (
              <li key={m.userId} className="flex items-center justify-between text-sm py-1 border-b border-border/50">
                <span>{m.name || m.email || m.userId}</span>
                <span className="flex items-center gap-2">
                  <span className="text-muted-foreground capitalize">{m.role.toLowerCase()}</span>
                  {m.role !== 'OWNER' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-destructive hover:bg-destructive/10"
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
