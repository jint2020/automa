/*
 * @Description: 优惠参数设置块 Handler
 * @Author: Jin Tang
 * @Date: 2025-12-17
 */

export default function () {
  return {
    async telecomPreferenceSetParam({ data, id }) {
      try {
        const {
          isZtSource,
          waitTimeout,
          handleErrorDialog,
          preferenceSetParamList,
        } = data;

        // 构建配置数据
        const config = {
          isZtSource,
          waitTimeout,
          handleErrorDialog,
          preferenceSetParamList: preferenceSetParamList || [],
          timestamp: new Date().toISOString(),
        };

        // 这里可以添加实际的业务逻辑
        // 例如：根据 isZtSource 选择不同的处理方式
        // 遍历 preferenceSetParamList 设置每个参数组的参数

        return {
          data: config,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`优惠参数设置失败: ${error.message}`);
      }
    },
  };
}
