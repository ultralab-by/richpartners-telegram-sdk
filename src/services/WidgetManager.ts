import { WidgetType } from '../types/widgetTypes';

interface WidgetConfig {
    id: string;
    type: WidgetType;
    settings: Record<string, unknown>;
}

class WidgetManager {

}

export default WidgetManager;