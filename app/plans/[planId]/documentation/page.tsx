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
            <div className="h-screen flex items-center justify-center bg-background">
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
                                Back to My Plans
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background pointer-events-none" />

            <AppHeader
                backHref={`/plans/${planId}`}
                title="Documentation"
                subtitle={`${plan.name} • Manage project documentation and task details`}
                showLogo={false}
            >
                    <div className="flex items-center gap-2 bg-muted/30 p-1 rounded-lg border border-border/50">
                        <button
                            onClick={() => setActiveView('viewer')}
                            className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeView === 'viewer'
                                    ? 'bg-background shadow-sm text-primary'
                                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                }`}
                        >
                            <Layout className="w-4 h-4" />
                            View
                        </button>
                        {canEdit && (
                            <>
                                <button
                                    onClick={() => setActiveView('editor')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeView === 'editor'
                                            ? 'bg-background shadow-sm text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    <FileEdit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => setActiveView('details')}
                                    className={`flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all ${activeView === 'details'
                                            ? 'bg-background shadow-sm text-primary'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
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
                <div className="h-full glass-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
                    {(activeView === 'viewer' || !canEdit) && <DocPanel />}
                    {canEdit && activeView === 'editor' && <DocEditor />}
                    {canEdit && activeView === 'details' && <TaskDetailsEditor />}
                </div>
            </main>
        </div>
    );
}
