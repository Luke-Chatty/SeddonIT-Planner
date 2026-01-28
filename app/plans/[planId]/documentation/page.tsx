'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanStore } from '@/lib/store';
import { DocPanel } from '@/components/Documentation/DocPanel';
import { DocEditor } from '@/components/Documentation/DocEditor';
import { TaskDetailsEditor } from '@/components/Documentation/TaskDetailsEditor';
import { Button } from '@/components/UI/Button';
import { ArrowLeft, FileText, Layout, FileEdit, List } from 'lucide-react';

type PanelView = 'viewer' | 'editor' | 'details';

export default function DocumentationPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.planId as string;

    const { plan, loadPlan } = usePlanStore();
    const [activeView, setActiveView] = useState<PanelView>('viewer');

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
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">Loading documentation...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col bg-background text-foreground overflow-hidden relative">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background pointer-events-none" />

            {/* Header */}
            <header className="flex-shrink-0 glass border-b border-border/40 px-6 py-4 shadow-sm z-10">
                <div className="flex items-center justify-between max-w-7xl mx-auto w-full">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="p-2"
                            onClick={() => router.push(`/plans/${planId}`)}
                        >
                            <ArrowLeft className="w-4 h-4" />
                        </Button>
                        <div>
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-blue-600 dark:to-blue-400 bg-clip-text text-transparent">
                                Documentation
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {plan.name} • Manage project documentation and task details
                            </p>
                        </div>
                    </div>

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
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 overflow-hidden max-w-7xl mx-auto w-full p-6">
                <div className="h-full glass-card rounded-xl border border-border/50 shadow-sm overflow-hidden flex flex-col">
                    {activeView === 'viewer' && <DocPanel />}
                    {activeView === 'editor' && <DocEditor />}
                    {activeView === 'details' && <TaskDetailsEditor />}
                </div>
            </main>
        </div>
    );
}
