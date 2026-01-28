'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { usePlanStore } from '@/lib/store';
import { TaskForm } from '@/components/TaskManager/TaskForm';
import { Button } from '@/components/UI/Button';
import { ArrowLeft } from 'lucide-react';

export default function TaskDetailPage() {
    const params = useParams();
    const router = useRouter();
    const planId = params.planId as string;
    const taskId = params.taskId as string;

    const { plan, loadPlan } = usePlanStore();
    const [task, setTask] = useState<any>(null); // Using any temporarily to avoid type issues until loaded

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

    if (!plan || !task) {
        return (
            <div className="h-screen flex items-center justify-center bg-background">
                <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-lg text-muted-foreground">Loading task details...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground relative flex flex-col">
            <div className="fixed inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-100/50 via-background to-background dark:from-blue-900/20 dark:via-background dark:to-background pointer-events-none" />

            {/* Header */}
            <header className="glass border-b border-border/40 px-6 py-4 shadow-sm z-10 sticky top-0">
                <div className="flex items-center gap-4 w-full mx-auto">
                    <Button
                        variant="ghost"
                        size="sm"
                        className="p-2"
                        onClick={handleClose}
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div>
                        <h1 className="text-xl font-bold text-foreground">
                            {task.title}
                        </h1>
                        <p className="text-sm text-muted-foreground">
                            {plan.name} • Task Details
                        </p>
                    </div>
                </div>
            </header>

            {/* Main Content - Full Screen Mode */}
            <main className="flex-1 w-full h-[calc(100vh-80px)] p-4 md:p-6 overflow-hidden">
                <div className="glass-card w-full h-full rounded-xl border border-border/60 shadow-2xl p-6 md:p-8 overflow-hidden flex flex-col bg-white/80 dark:bg-slate-900/80">
                    <TaskForm
                        task={task}
                        onClose={handleClose}
                        onSave={() => {
                            // Optional: show toast
                        }}
                    />
                </div>
            </main>
        </div>
    );
}
