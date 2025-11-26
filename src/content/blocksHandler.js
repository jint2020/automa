import customHandlers from '@business/blocks/contentHandler';
import { toCamelCase } from '@/utils/helper';

// Vite's import.meta.glob for auto-importing block handlers
const blocksHandler = import.meta.glob('./blocksHandler/*.js', { eager: true });
const handlers = Object.keys(blocksHandler).reduce((acc, path) => {
  // Extract handler name from path
  // Path format: ./blocksHandler/handlerClick.js
  const fileName = path.split('/').pop();
  const name = fileName.replace(/^handler|\.js$/g, '');

  acc[toCamelCase(name)] = blocksHandler[path].default;

  return acc;
}, {});

export default function () {
  return {
    ...(customHandlers() || {}),
    ...handlers,
  };
}
