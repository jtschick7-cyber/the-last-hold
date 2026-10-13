// Plan v0.0 acceptance 3: a value saved in the preview is not visible in live, and
// vice versa. Both share one origin on GitHub Pages, so this is the whole guarantee.
import { describe, expect, it } from 'vitest';
import { memoryBackend } from '../../tests/helpers/memory-storage';
import { createChannelStorage, storagePrefix } from './storage';

describe('channel storage', () => {
  it('uses the technical design §9.1 prefixes', () => {
    expect(storagePrefix('live')).toBe('lasthold:');
    expect(storagePrefix('preview')).toBe('lasthold-preview:');
  });

  it('neither prefix is a prefix of the other', () => {
    const live = storagePrefix('live');
    const preview = storagePrefix('preview');
    expect(preview.startsWith(live)).toBe(false);
    expect(live.startsWith(preview)).toBe(false);
  });

  it('isolates preview from live in both directions', () => {
    const backend = memoryBackend();
    const live = createChannelStorage('live', backend);
    const preview = createChannelStorage('preview', backend);

    live.set('save', 'live-save');
    expect(preview.get('save')).toBeNull();

    preview.set('save', 'preview-save');
    expect(live.get('save')).toBe('live-save');
    expect(preview.get('save')).toBe('preview-save');

    preview.remove('save');
    expect(live.get('save')).toBe('live-save');

    live.set('opens', '3');
    expect(live.names().sort()).toEqual(['opens', 'save']);
    expect(preview.names()).toEqual([]);
  });
});
