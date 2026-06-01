export type WidgetBlockItem = {
  id: string;
  title: string;
  start: string;
  end: string;
  status: string;
};

export type WidgetTaskItem = {
  id: string;
  title: string;
  status: string;
};

export type WidgetCurrentBlock = {
  title: string;
  start: string;
  end: string;
};

export type WidgetSnapshot = {
  date: string;
  completion: number;
  blocks: WidgetBlockItem[];
  tasks: WidgetTaskItem[];
  current: WidgetCurrentBlock | null;
};
