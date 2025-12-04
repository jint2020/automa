import { reactive, onMounted } from 'vue';
import { getBlocks } from '@/utils/getSharedData';
import { categories } from '@/utils/shared';

export function useEditorBlock(label) {
  const blocks = getBlocks();
  const block = reactive({
    details: {},
    category: {},
  });

  onMounted(() => {
    if (!label) return;

    const details = blocks[label];
    if (!details) {
      // NOTE: Gracefully handle blocks that are not registered locally
      block.details = { id: label };
      block.category = null;
      return;
    }

    block.details = { id: label, ...details };
    block.category = categories[details.category] || null;
  });

  return block;
}
