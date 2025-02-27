import { WidgetType } from '../types/widgetTypes';

interface WidgetConfig {
    id: string;
    type: WidgetType;
    settings: Record<string, unknown>;
}

class WidgetManager {
    private widgets: Map<string, WidgetConfig> = new Map();

    addWidget(config: WidgetConfig): void {
        this.widgets.set(config.id, config);
    }

    getWidget(id: string): WidgetConfig | undefined {
        return this.widgets.get(id);
    }

    removeWidget(id: string): void {
        this.widgets.delete(id);
    }
}

export default WidgetManager;