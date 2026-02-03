'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanStore } from '@/lib/store';
import { TaskForm } from '@/components/TaskManager/TaskForm';
import { Button } from '@/components/UI/Button';
import { AppHeader } from '@/components/AppHeader';

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.planId as string;
    const taskId = params.taskId as string;

    const { plan, planRole, loadPlan, isLoading } = usePlanStore();
    const [task, setTask] = useState<any>(null);
    const readOnly = planRole === 'VIEWER';

    useEffect(() => {
        if (typeof window !== 'undefined' && planId) {
            loadPlan(planId);
        }
    }, [planId, loadPlan]);

    useEffect(() => {
        if (plan && taskId) {
            const foundTask = plan.tasks.find(t => t.id === taskId);
            if (foundTask) {
                setTask(foundTask);
            } else {
                // Handle task not found?
            }
        }
    }, [plan, taskId]);

    const handleClose = () => {
        // Navigate back to the plan overview or task list
        router.push(`/plans/${planId}`);
    };

    if (!plan) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    {isLoading ? (
                        <>
                            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                            <p className="text-lg text-muted-foreground">Loading task details...</p>
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

    if (!task) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading task details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative flex flex-col">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background pointer-events-none" />

            <AppHeader
                backHref={`/plans/${planId}`}
                title={task.title}
                subtitle={`${plan.name} • Task Details`}
                showLogo={false}
            />

            {/* Main Content - Full Screen Mode */}
            <main className="flex-1 w-full h-[calc(100vh-80px)] p-4 md:p-6 overflow-hidden">
                <div className="glass-card w-full h-full rounded-xl border border-border/60 shadow-2xl p-6 md:p-8 overflow-hidden flex flex-col bg-white/80 dark:bg-slate-900/80">
                    <TaskForm
                        task={task}
                        onClose={handleClose}
                        onSave={() => {}}
                        readOnly={readOnly}
                    />
                </div>
            </main>
        </div>
    );
}
