/*
 * @Description: 产品信息配置处理器
 * @Author: Jin Tang
 * @Date: 2025-12-17
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-17
 */
export default function () {
  return {
    'prod-info': async function ({ data, id }) {
      try {
        const { productInfo } = data;

        // 按照 order 排序产品信息
        const sortedProductInfo = [...(productInfo || [])].sort(
          (a, b) => a.order - b.order
        );

        // 构建产品信息配置对象
        const prodInfoConfig = {
          items: [],
          checks: [],
          unchecks: [],
        };

        // 处理每个产品信息项
        sortedProductInfo.forEach((info) => {
          const { type, key, value } = info;

          // 跳过空项
          if (!key) return;

          const infoItem = {
            key,
            value,
            order: info.order,
          };

          // 根据类型分类
          switch (type) {
            case 'check':
              prodInfoConfig.checks.push(infoItem);
              break;
            case 'uncheck':
              prodInfoConfig.unchecks.push(infoItem);
              break;
            case 'infoItem':
              prodInfoConfig.items.push(infoItem);
              break;
            default:
              // 默认作为普通信息项处理
              prodInfoConfig.items.push(infoItem);
          }
        });

        // 添加时间戳
        prodInfoConfig.timestamp = new Date().toISOString();
        prodInfoConfig.totalCount = sortedProductInfo.length;

        // 返回结果给下一个节点
        return {
          data: prodInfoConfig,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`产品信息配置处理失败: ${error.message}`);
      }
    },
  };
}
