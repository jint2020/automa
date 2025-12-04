/**
 * Block Registry API
 * 块注册表 - 查询可用的工作流块类型及其定义
 */

import { http } from './interceptor';

/**
 * Get all block definitions
 * 获取系统中所有可用的工作流块定义，包括块的名称、图标、输入输出配置等元数据
 * @returns {Promise}
 */
export function getAllBlocks() {
  return http.get('/blocks');
}

/**
 * Get block definition by label
 * 根据块标签获取单个块的详细定义信息
 * @param {string} label
 * @returns {Promise}
 */
export function getBlock(label) {
  return http.get(`/blocks/${label}`);
}

/**
 * Get blocks by category
 * 根据块分类(如 general、browser、web-interaction 等)获取该分类下的所有块定义
 * @param {string} category
 * @returns {Promise}
 */
export function getBlocksByCategory(category) {
  return http.get(`/blocks/category/${category}`);
}

export default {
  getAllBlocks,
  getBlock,
  getBlocksByCategory,
};
