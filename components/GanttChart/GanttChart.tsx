'use client';

import { useEffect, useState, useRef } from 'react';
import { usePlanStore } from '@/lib/store';
import { Task as AppTask } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { format, differenceInDays, addDays, startOfWeek, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { Button } from '../UI/Button';
import { Layers, ZoomIn, ZoomOut, Check, CheckCircle2, Plus, Bell, Search, Settings, Calendar as CalendarIcon, Filter, Users, MoreHorizontal, Share2, ChevronRight, ChevronDown } from 'lucide-react';
import { flattenTaskHierarchy } from '@/lib/taskHierarchy';

type ViewMode = 'Day' | 'Week' | 'Month';

export function GanttChart() {
  const { plan, updateTask } = usePlanStore();
  const router = useRouter();
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [collapsedTaskIds, setCollapsedTaskIds] = useState<string[]>([]);

  // View State
  const [viewMode, setViewMode] = useState<ViewMode>('Day');
  const [viewStartDate, setViewStartDate] = useState(new Date());
  const [viewDays, setViewDays] = useState(60);

  // Zoom State
  const [zoomLevel, setZoomLevel] = useState(100); // 50 to 200 percentage

  // Derived state for column width
  const getColumnWidth = () => {
    const zoomMultiplier = zoomLevel / 100;
    switch (viewMode) {
      case 'Day': return 60 * zoomMultiplier;
      case 'Week': return 25 * zoomMultiplier; // Tighter days
      case 'Month': return 8 * zoomMultiplier; // Very tight days
    }
    return 60;
  };
  const COLUMN_WIDTH = getColumnWidth();

  // Interaction State
  const [isDragging, setIsDragging] = useState(false);
  const [dragMode, setDragMode] = useState<'move' | 'resize-left' | 'resize-right' | null>(null);
  const [dragTaskId, setDragTaskId] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartTaskDate, setDragStartTaskDate] = useState<Date | null>(null);
  const [dragEndTaskDate, setDragEndTaskDate] = useState<Date | null>(null);

  useEffect(() => {
    if (plan?.tasks) {
      const validTasks = plan.tasks
        .filter(t => !isNaN(new Date(t.startDate).getTime()) && !isNaN(new Date(t.endDate).getTime()))
        .sort((a, b) => {
          const byOrder = (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
          if (byOrder !== 0) return byOrder;
          return a.createdAt.localeCompare(b.createdAt);
        });
      setTasks(validTasks);

      if (validTasks.length > 0) {
        const earliest = new Date(Math.min(...validTasks.map(t => new Date(t.startDate).getTime())));
        const start = new Date(earliest);
        start.setDate(start.getDate() - 5);
        setViewStartDate(start);
      }
    }
  }, [plan]);

  useEffect(() => {
    const taskIds = new Set(tasks.map((task) => task.id));
    setCollapsedTaskIds((prev) => prev.filter((id) => taskIds.has(id)));
  }, [tasks]);

  // --- Date Math ---
  const getDatePos = (dateStr: string) => {
    const date = new Date(dateStr);
    const diff = differenceInDays(date, viewStartDate);
    return diff * COLUMN_WIDTH;
  };

  const getDurationWidth = (startStr: string, endStr: string) => {
    const start = new Date(startStr);
    const end = new Date(endStr);
    let days = differenceInDays(end, start);
    if (days < 1) days = 1;
    return (days) * COLUMN_WIDTH;
  };

  // --- Nav Helpers ---
  const handleTaskDoubleClick = (e: React.MouseEvent, taskId: string) => {
    e.preventDefault();
    e.stopPropagation();
    router.push(`/plans/${plan?.id}/tasks/${taskId}`);
  };

  // --- Drag & Drop ---
  const handleDragStart = (e: React.MouseEvent, task: AppTask) => {
    e.preventDefault();
    e.stopPropagation();
    // Only allow drag on left click
    if (e.button !== 0) return;

    setIsDragging(true);
    setDragMode('move');
    setDragTaskId(task.id);
    setDragStartX(e.clientX);
    setDragStartTaskDate(new Date(task.startDate));
    setDragEndTaskDate(new Date(task.endDate));
  };

  const handleResizeStart = (e: React.MouseEvent, task: AppTask, side: 'left' | 'right') => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragMode(side === 'left' ? 'resize-left' : 'resize-right');
    setDragTaskId(task.id);
    setDragStartX(e.clientX);
    setDragStartTaskDate(new Date(task.startDate));
    setDragEndTaskDate(new Date(task.endDate));
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !dragTaskId || !dragStartTaskDate || !dragEndTaskDate) return;

      const deltaPixels = e.clientX - dragStartX;
      const deltaDays = Math.round(deltaPixels / COLUMN_WIDTH);

      // Optimistic update
      setTasks(prev => prev.map(t => {
        if (t.id !== dragTaskId) return t;

        if (dragMode === 'move') {
          const newStart = addDays(dragStartTaskDate, deltaDays);
          const duration = differenceInDays(dragEndTaskDate, dragStartTaskDate);
          const newEnd = addDays(newStart, duration);
          return { ...t, startDate: newStart.toISOString(), endDate: newEnd.toISOString() };
        }
        else if (dragMode === 'resize-right') {
          const newEnd = addDays(dragEndTaskDate, deltaDays);
          if (differenceInDays(newEnd, dragStartTaskDate) < 1) return t;
          return { ...t, endDate: newEnd.toISOString() };
        }
        else if (dragMode === 'resize-left') {
          const newStart = addDays(dragStartTaskDate, deltaDays);
          if (differenceInDays(dragEndTaskDate, newStart) < 1) return t;
          return { ...t, startDate: newStart.toISOString() };
        }
        return t;
      }));
    };

    const handleMouseUp = () => {
      if (isDragging && dragTaskId) {
        const currentTask = tasks.find(t => t.id === dragTaskId);
        if (currentTask) {
          updateTask(dragTaskId, {
            startDate: currentTask.startDate,
            endDate: currentTask.endDate
          });
        }
      }
      setIsDragging(false);
      setDragMode(null);
      setDragTaskId(null);
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
  }, [isDragging, dragTaskId, dragMode, dragStartX, dragStartTaskDate, dragEndTaskDate, tasks, updateTask, COLUMN_WIDTH]);


  // --- Render Helpers ---
  const renderCalendarHeader = () => {
    const headerDays = [];
    const numDaysToRender = viewMode === 'Month' ? 365 : viewDays; // Render more in month view

    for (let i = 0; i < numDaysToRender; i++) {
      const d = addDays(viewStartDate, i);
      headerDays.push(d);
    }

    // Month Row
    const monthRow = (
      <div className="flex h-8 items-center border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50 relative">
        {headerDays.map((d, i) => {
          const isFirstOfMonth = d.getDate() === 1;
          const isStartOfView = i === 0;

          if (isFirstOfMonth || isStartOfView) {
            // Don't show if it's the 30th or 31st and we just started view
            if (isStartOfView && d.getDate() > 20 && !isFirstOfMonth) return null;

            return (
              <div key={`m-${i}`} className="absolute px-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap" style={{ left: i * COLUMN_WIDTH }}>
                {format(d, 'MMMM yyyy')}
              </div>
            );
          }
          return null;
        })}
      </div>
    );

    // Days/Weeks Row
    const daysRow = (
      <div className="flex h-8 items-center bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800">
        {headerDays.map((d, i) => {
          const isToday = isSameDay(d, new Date());
          // Optimization: In Month view, only render ticks or simple blocks
          if (viewMode === 'Month') {
            // Only show start of weeks in month view text
            if (d.getDay() === 1) { // Monday
              return (
                <div key={i} className="flex justify-center border-l border-gray-100 dark:border-gray-800 text-[9px] text-gray-400" style={{ width: COLUMN_WIDTH * 7 }}>
                  {d.getDate()}
                </div>
              )
            }
            return null; // Skip non-Mondays
            return <div key={i} style={{ width: COLUMN_WIDTH }} className={`border-r border-transparent ${isToday ? 'bg-blue-50/50' : ''}`} />
          }

          return (
            <div
              key={i}
              className={`flex items-center justify-center border-r border-transparent text-[10px] font-medium text-gray-400 select-none ${isToday ? 'text-blue-600 font-bold' : ''}`}
              style={{ width: COLUMN_WIDTH }}
            >
              {/* In Week view, maybe show Day Initials on top? */}
              {viewMode === 'Week' ? d.getDate() : format(d, 'dd')}
            </div>
          );
        })}
      </div>
    );

    return (
      <div className="flex flex-col min-w-max">
        {monthRow}
        {viewMode !== 'Month' && daysRow}
      </div>
    );
  };


  const getTaskStyles = (task: AppTask) => {
    // Universal High Contrast Text
    const highContrastText = 'text-gray-900 dark:text-white font-bold drop-shadow-[0_1px_1px_rgba(255,255,255,0.8)] dark:drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)]';

    if (task.status === 'completed') {
      return {
        bg: 'bg-brand-green/20 dark:bg-brand-green/30',
        border: 'border-brand-green/40',
        fill: 'bg-brand-green',
        text: highContrastText
      };
    }
    if (task.status === 'blocked' || task.priority === 'critical') {
      return {
        bg: 'bg-brand-red/20 dark:bg-brand-red/30',
        border: 'border-brand-red/40',
        fill: 'bg-brand-red',
        text: highContrastText
      };
    }
    if (task.status === 'not-started') {
      return {
        bg: 'bg-brand-purple/20 dark:bg-brand-purple/30',
        border: 'border-brand-purple/40',
        fill: 'bg-brand-purple',
        text: highContrastText
      };
    }
    if (task.priority === 'high') {
      return {
        bg: 'bg-brand-orange/20 dark:bg-brand-orange/30',
        border: 'border-brand-orange/40',
        fill: 'bg-brand-orange',
        text: highContrastText
      };
    }
    // Default (Navy/Cyan)
    return {
      bg: 'bg-brand-cyan/20 dark:bg-brand-cyan/30',
      border: 'border-brand-cyan/40',
      fill: 'bg-brand-cyan',
      text: highContrastText
    };
  };

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  const hierarchyRows = flattenTaskHierarchy(tasks, {
    collapsedTaskIds: new Set(collapsedTaskIds),
  });
  const rowIndexByTaskId = new Map(hierarchyRows.map((row, index) => [row.task.id, index]));
  const timelineWidth = Math.max(2000, (viewMode === 'Month' ? 365 : viewDays) * COLUMN_WIDTH);
  const toggleCollapse = (taskId: string) => {
    setCollapsedTaskIds((prev) =>
      prev.includes(taskId) ? prev.filter((id) => id !== taskId) : [...prev, taskId]
    );
  };

  if (!plan) return null;

  return (
    <div className="flex h-full w-full flex-col bg-white dark:bg-slate-900 overflow-hidden font-sans select-none">

      {/* Toolbar */}
      <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 px-6 py-4">
        <div className="flex items-center gap-4">
          <h2 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">Timeline</h2>
        </div>
        <div className="flex items-center gap-4">

          {/* Zoom Slider */}
          <div className="hidden md:flex items-center gap-2 mr-4 bg-gray-50 dark:bg-gray-800 px-3 py-1.5 rounded-lg border border-gray-100 dark:border-gray-700">
            <ZoomOut className="w-3 h-3 text-gray-400" />
            <input
              type="range"
              min="50"
              max="200"
              value={zoomLevel}
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700 accent-brand-navy dark:accent-brand-cyan"
            />
            <ZoomIn className="w-3 h-3 text-gray-400" />
            <span className="text-[10px] font-mono w-8 text-right text-gray-500">{zoomLevel}%</span>
          </div>

          <div className="flex items-center rounded-lg bg-gray-100 dark:bg-gray-800 p-1">
            <button
              onClick={() => setViewMode('Day')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'Day' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
            >
              Days
            </button>
            <button
              onClick={() => setViewMode('Week')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'Week' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
            >
              Weeks
            </button>
            <button
              onClick={() => setViewMode('Month')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${viewMode === 'Month' ? 'bg-white dark:bg-gray-700 shadow-sm text-primary dark:text-white' : 'text-gray-500 hover:text-gray-900 dark:text-gray-400'}`}
            >
              Months
            </button>
          </div>
          <Button size="sm" className="bg-brand-navy hover:bg-brand-navy/90 text-white font-bold text-xs px-4" onClick={() => {
            setViewStartDate(addDays(new Date(), -3));
          }}>
            Today
          </Button>
        </div>
      </div>

      {/* content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar List */}
        <div className="flex w-80 flex-col border-r border-gray-100 dark:border-gray-800 bg-white dark:bg-slate-900 shrink-0">
          <div className="flex h-12 items-center px-6 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50">
            <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Task Name</span>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            {hierarchyRows.map((row) => (
              <div
                key={row.task.id}
                onDoubleClick={(e) => handleTaskDoubleClick(e, row.task.id)}
                className="flex h-12 items-center px-6 border-b border-gray-50 dark:border-gray-800/50 hover:bg-blue-50/50 dark:hover:bg-blue-900/10 cursor-pointer transition-colors group gap-2"
                style={{ paddingLeft: `${24 + Math.max(0, row.depth) * 18}px` }}
              >
                {row.hasChildren && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleCollapse(row.task.id);
                    }}
                    className="h-5 w-5 rounded border border-gray-200 dark:border-gray-700 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-800"
                    aria-label={row.isCollapsed ? 'Expand child tasks' : 'Collapse child tasks'}
                  >
                    {row.isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                )}
                {row.task.status === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400" aria-hidden />
                )}
                <span className="text-sm font-medium truncate text-gray-700 dark:text-gray-200 group-hover:text-blue-600 dark:group-hover:text-blue-400">{row.task.title}</span>
                {row.hasChildren && row.rollup.totalDescendants > 0 && (
                  <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
                    {row.rollup.percentComplete}%
                  </span>
                )}
                {row.task.assignedTo && (
                  <div className="ml-auto flex -space-x-2">
                    <div className="h-6 w-6 rounded-full bg-gray-100 border-2 border-white dark:border-gray-900 flex items-center justify-center text-[9px] font-bold text-gray-500">
                      {getInitials(row.task.assignedTo)}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Timeline Chart */}
        <div className="flex-1 overflow-auto bg-white dark:bg-slate-900 relative">
          <div className="min-w-fit inline-block relative pr-32" style={{ width: timelineWidth }}>
            {/* Calendar Header sticky */}
            <div className="sticky top-0 z-30 flex flex-col bg-white dark:bg-slate-900 border-b border-gray-100 dark:border-gray-800 w-full min-w-max">
              {renderCalendarHeader()}
            </div>

            {/* Grid Background */}
            <style jsx>{`
                        .gantt-grid-bg {
                             background-image: linear-gradient(to right, #f3f4f6 1px, transparent 1px);
                             background-size: ${COLUMN_WIDTH}px 100%;
                        }
                        .dark .gantt-grid-bg {
                             background-image: linear-gradient(to right, #1f2937 1px, transparent 1px);
                        }
                        /* Hide grid in month view if too dense */
                        ${viewMode === 'Month' ? `.gantt-grid-bg { background-size: ${COLUMN_WIDTH * 7}px 100%; }` : ''}
                     `}</style>
            <div className="absolute inset-0 z-0 pointer-events-none gantt-grid-bg top-16 h-full w-full" />

            {/* Today Line */}
            {(() => {
              const todayPos = differenceInDays(new Date(), viewStartDate) * COLUMN_WIDTH;
              if (todayPos >= 0) {
                return (
                  <div
                    className="absolute top-16 bottom-0 w-px bg-brand-orange z-10"
                    style={{ left: todayPos + (COLUMN_WIDTH / 2) }}
                  >
                    <div className="absolute -top-1 -left-1.5 h-3 w-3 bg-brand-orange rounded-full ring-2 ring-white dark:ring-slate-900" />
                  </div>
                )
              }
              return null;
            })()}

            {/* Milestones Layer */}
            {(plan.milestones ?? []).map((milestone) => {
              const x = getDatePos(milestone.date) + COLUMN_WIDTH / 2;
              if (x < -12 || x > timelineWidth + 12) return null;
              const showLabel = viewMode !== 'Month';

              return (
                <div
                  key={milestone.id}
                  className="absolute top-16 bottom-0 z-20 pointer-events-none"
                  style={{ left: x }}
                  title={`${milestone.title} • ${format(new Date(milestone.date), 'd MMM yyyy')}`}
                >
                  <div className="absolute top-1 -left-[5px] h-[10px] w-[10px] rotate-45 bg-amber-500 ring-2 ring-white dark:ring-slate-900" />
                  <div className="absolute top-4 bottom-0 w-px bg-amber-500/50 border-dashed border-l border-amber-500/60" />
                  {showLabel && (
                    <span className="absolute top-0 left-2 whitespace-nowrap rounded bg-amber-100/90 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 px-1.5 py-0.5 text-[10px] font-semibold">
                      {milestone.title}
                    </span>
                  )}
                </div>
              );
            })}

            {/* Dependency Arrows Layer */}
            <svg className="absolute inset-0 z-0 pointer-events-none w-full h-full text-brand-grey/80 dark:text-brand-grey/60 top-16">
              {hierarchyRows.map((row, index) => {
                const task = row.task;
                if (!task.dependencies || task.dependencies.length === 0) return null;

                // Find parent tasks and draw lines
                return task.dependencies.map(depId => {
                  const parentIdx = rowIndexByTaskId.get(depId);
                  if (parentIdx === undefined) return null;
                  const parentTask = hierarchyRows[parentIdx].task;

                  // Coordinates
                  // Parent (Source): Right Edge, Vertical Center
                  const startX = getDatePos(parentTask.endDate);
                  const startY = (parentIdx * 48) + 24; // 48px row height, 24px center

                  // Child (Target): Left Edge, Vertical Center
                  const endX = getDatePos(task.startDate);
                  const endY = (index * 48) + 24;

                  const minGap = 20;
                  let pathData = '';

                  // Path Calculation
                  if (endX < startX + minGap) {
                    // S-Bend (Backwards)
                    // 1. Right to gap
                    // 2. Down halfway
                    // 3. Left to before child
                    // 4. Down to child row
                    // 5. Right to child
                    const firstTurnX = startX + minGap;
                    const secondTurnX = endX - minGap;
                    const midY = startY + ((endY - startY) / 2);

                    pathData = `
                                        M ${startX} ${startY} 
                                        L ${firstTurnX} ${startY} 
                                        L ${firstTurnX} ${midY} 
                                        L ${secondTurnX} ${midY} 
                                        L ${secondTurnX} ${endY} 
                                        L ${endX} ${endY}
                                    `;
                  } else {
                    // Standard (Forward)
                    const turnX = startX + minGap;
                    pathData = `
                                        M ${startX} ${startY} 
                                        L ${turnX} ${startY} 
                                        L ${turnX} ${endY} 
                                        L ${endX} ${endY}
                                    `;
                  }

                  return (
                    <path
                      key={`${depId}-${task.id}`}
                      d={pathData}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                      opacity="0.8"
                    />
                  );
                });
              })}
            </svg>


            {/* Task Bars Area */}
            <div className="flex flex-col pt-0 relative z-10">
              {hierarchyRows.map((row) => {
                const task = row.task;
                const left = getDatePos(task.startDate);
                const width = getDurationWidth(task.startDate, task.endDate);
                const styles = getTaskStyles(task);

                let progressPct = 0;
                if (row.hasChildren && row.rollup.totalDescendants > 0) progressPct = row.rollup.percentComplete;
                else if (task.status === 'completed') progressPct = 100;
                else if (task.status === 'in-progress') progressPct = 45;

                const isMoving = isDragging && dragTaskId === task.id;

                // Hide text if too small
                const showText = width > 30;

                return (
                  <div key={task.id} className="h-12 border-b border-gray-50 dark:border-gray-800/50 flex items-center relative group hover:bg-gray-50/30 w-full"
                  >
                    {/* The Draggable Pill */}
                    <div
                      className={`absolute h-6 rounded-full border flex items-center overflow-visible transition-shadow ${styles.bg} ${styles.border} ${isMoving ? 'cursor-grabbing shadow-lg scale-[1.01] z-50 ring-2 ring-blue-400/20' : 'cursor-grab hover:shadow-md'}`}
                      style={{ left: `${left}px`, width: `${width}px` }}
                      onMouseDown={(e) => handleDragStart(e, task)}
                      onDoubleClick={(e) => handleTaskDoubleClick(e, task.id)}
                      title={`${task.title} • ${format(new Date(task.startDate), 'd MMM yyyy')} – ${format(new Date(task.endDate), 'd MMM yyyy')}${task.assignedTo ? ` • ${task.assignedTo}` : ''} • ${task.status}`}
                    >
                      {/* Resize Handle Left */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-4 cursor-col-resize z-30 opacity-0 group-hover:opacity-100"
                        onMouseDown={(e) => handleResizeStart(e, task, 'left')}
                        title="Resize Start"
                      />

                      {/* Progress Fill */}
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full opacity-80 pointer-events-none ${styles.fill}`}
                        style={{ width: `${progressPct}%` }}
                      />

                      {/* Label */}
                      {showText && (
                        <span className={`relative z-10 text-[10px] font-bold ml-3 pointer-events-none select-none truncate pr-2 ${styles.text}`}>
                          {task.title}
                        </span>
                      )}

                      {/* Resize Handle Right */}
                      <div
                        className="absolute right-0 top-0 bottom-0 w-4 cursor-col-resize z-30 opacity-0 group-hover:opacity-100"
                        onMouseDown={(e) => handleResizeStart(e, task, 'right')}
                        title="Resize End"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
