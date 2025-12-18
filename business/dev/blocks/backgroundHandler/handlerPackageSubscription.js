/*
 * @Description: 办理套餐块 Handler
 * @Author: Jin Tang
 * @Date: 2025-12-17
 */

export default function () {
  return {
    async telecomPackageSubscription({ data, id }) {
      try {
        const { description, productList } = data;

        // 构建配置数据
        const config = {
          description,
          productList: productList || [],
          timestamp: new Date().toISOString(),
        };

        // 这里可以添加实际的业务逻辑
        // 例如：调用 CRM API、操作页面元素等
        // 目前主要关注数据保存和流转

        return {
          data: config,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`办理套餐失败: ${error.message}`);
      }
    },
  };
}
