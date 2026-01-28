declare module 'frappe-gantt' {
  interface GanttTask {
    id: string;
    name: string;
    start: string;
    end: string;
    progress?: number;
    dependencies?: string;
    custom_class?: string;
  }

  interface GanttOptions {
    view_mode?: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month';
    language?: string;
    header_height?: number;
    column_width?: number;
    step?: number;
    bar_height?: number;
    bar_corner_radius?: number;
    arrow_curve?: number;
    padding?: number;
    date_format?: string;
    on_click?: (task: any) => void;
    on_date_change?: (task: any, start: Date, end: Date) => void;
    on_progress_change?: (task: any, progress: number) => void;
  }

  class Gantt {
    constructor(wrapper: HTMLElement, tasks: GanttTask[], options?: GanttOptions);
    change_view_mode(mode: 'Quarter Day' | 'Half Day' | 'Day' | 'Week' | 'Month'): void;
    refresh(tasks: GanttTask[]): void;
  }

  export default Gantt;
}