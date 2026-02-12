'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanStore } from '@/lib/store';
import { TaskForm } from '@/components/TaskManager/TaskForm';
import { Button } from '@/components/UI/Button';
import { AppHeader } from '@/components/AppHeader';
import { Breadcrumbs } from '@/components/Breadcrumbs';

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.planId as string;
    const taskId = params.taskId as string;

    const { plan, planRole, loadPlan, duplicateTask, isLoading } = usePlanStore();
    const [task, setTask] = useState<any>(null);
    const readOnly = planRole === 'VIEWER';
    const canEdit = planRole === 'OWNER' || planRole === 'EDITOR';

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
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524]">
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
                                Back to My Plan
                            </Button>
                        </>
                    )}
                </div>
            </div>
        );
    }

    if (!task) {
        return (
            <div className="h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524]">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-lg text-muted-foreground">Loading task details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-slate-200 dark:from-[#001524] dark:via-[#022943]/20 dark:to-[#001524] text-foreground relative flex flex-col">
            <div className="fixed inset-0 -z-10 bg-[url('/grain.png')] opacity-[0.03] pointer-events-none" />
            <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#022943]/5 dark:bg-blue-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

            <div className="px-6 pt-4 pb-2 flex items-center justify-between gap-4 flex-wrap">
                <Breadcrumbs
                    items={[
                        { label: 'My Plans', href: '/' },
                        { label: plan.name, href: `/plans/${planId}` },
                        { label: 'Tasks', href: `/plans/${planId}/tasks` },
                        { label: task.title },
                    ]}
                />
                {canEdit && (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => { duplicateTask(task.id); router.push(`/plans/${planId}/tasks`); }}
                    >
                        Duplicate task
                    </Button>
                )}
            </div>
            <AppHeader
                backHref={`/plans/${planId}`}
                title={task.title}
                subtitle={`${plan.name} • Task Details`}
                showLogo={false}
            />

            {/* Main Content - Full Screen Mode */}
            <main className="flex-1 w-full h-[calc(100vh-80px)] p-4 md:p-6 overflow-hidden">
                <div className="w-full h-full rounded-[20px] border border-slate-200 dark:border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.08)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-6 md:p-8 overflow-hidden flex flex-col bg-white dark:bg-[#022943]">
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
