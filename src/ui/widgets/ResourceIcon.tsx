import { resourceIconId } from '../../content/assets';
import type { ResourceId } from '../../content/resources';
import { Sprite } from './Sprite';

// A 16 px resource icon from the asset manifest (GDD §9.12), inline with text.
export const ResourceIcon = ({ r }: { r: ResourceId }) => <Sprite id={resourceIconId(r)} />;
