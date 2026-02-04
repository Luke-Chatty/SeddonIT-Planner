'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanStore } from '@/lib/store';
import { DocPanel } from '@/components/Documentation/DocPanel';
import { DocEditor } from '@/components/Documentation/DocEditor';
import { TaskDetailsEditor } from '@/components/Documentation/TaskDetailsEditor';
import { Button } from '@/components/UI/Button';
import { FileText, Layout, FileEdit, List } from 'lucide-react';
import { AppHeader } from '@/components/AppHeader';

type PanelView = 'viewer' | 'editor' | 'details';

export default function DocumentationPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.planId as string;

    const { plan, planRole, loadPlan, isLoading } = usePlanStore();
    const [activeView, setActiveView] = useState<PanelView>('viewer');
    const canEdit = planRole === 'OWNER' || planRole === 'EDITOR';

    useEffect(() => {
        if (typeof window !== 'undefined' && planId) {
            loadPlan(planId);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [planId]);

    if (!plan) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524]">
                <div className="text-center">
                    {isLoading ? (
                        <>
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">Loading documentation...</p>
                        </>
                    ) : (
                        <>
                            <p className="text-lg font-medium text-foreground mb-2">Plan not found or access denied</p>
                            <p className="text-muted-foreground mb-4">This plan does not exist or you don’t have permission to view it.</p>
                            <Button variant="primary" onClick={() => router.push('/')}>
                                Back to My Plan
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524] text-foreground overflow-hidden relative">
            <div className="fixed inset-0 -z-10 bg-[url('/grain.png')] opacity-[0.03] pointer-events-none" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#022943]/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <AppHeader
                backHref={`/plans/${planId}`}
                title="Documentation"
                subtitle={`${plan.name} • Manage project documentation and task details`}
                showLogo={false}
            >
                    <div className="flex items-center gap-2 bg-slate-100/80 dark:bg-white/10 p-1 rounded-xl border border-slate-200 dark:border-white/10">
                        <button
                            onClick={() => setActiveView('viewer')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${activeView === 'viewer'
                                    ? 'bg-white dark:bg-[#022943] shadow-sm text-[#022943] dark:text-white'
                                    : 'text-slate-600 dark:text-slate-400 hover:text-[#022943] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                                }`}
                        >
                            <Layout className="w-4 h-4" />
                            View
                        </button>
                        {canEdit && (
                            <>
                                <button
                                    onClick={() => setActiveView('editor')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${activeView === 'editor'
                                            ? 'bg-white dark:bg-[#022943] shadow-sm text-[#022943] dark:text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-[#022943] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <FileEdit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setActiveView('details')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg transition-all ${activeView === 'details'
                                            ? 'bg-white dark:bg-[#022943] shadow-sm text-[#022943] dark:text-white'
                                            : 'text-slate-600 dark:text-slate-400 hover:text-[#022943] dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/10'
                                        }`}
                                >
                                    <List className="w-4 h-4" />
                                    Task Details
                                </button>
                            </>
                        )}
                    </div>
            </AppHeader>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden max-w-7xl mx-auto w-full p-6">
                <div className="h-full rounded-[20px] border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] bg-white dark:bg-[#022943] overflow-hidden flex flex-col">
                    {(activeView === 'viewer' || !canEdit) && <DocPanel />}
                    {canEdit && activeView === 'editor' && <DocEditor />}
                    {canEdit && activeView === 'details' && <TaskDetailsEditor />}
                </div>
            </main>
        </div>
    );
}
