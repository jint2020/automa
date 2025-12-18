/*
 * @Description: 套餐操作块 Handler
 * @Author: Jin Tang
 * @Date: 2025-12-17
 */

export default function () {
  return {
    async telecomPackageOperate({ data, id }) {
      try {
        const {
          packageName,
          packageCode,
          objectList,
          packageType,
          operate,
          filterExpired,
          handleSkipValidation,
          handleOfflineProduct,
          saveIdCode,
          idCodeVariable,
        } = data;

        // 构建配置数据
        const config = {
          packageName,
          packageCode,
          objectList,
          packageType,
          operate,
          filterExpired,
          handleSkipValidation,
          handleOfflineProduct,
          saveIdCode,
          idCodeVariable,
          timestamp: new Date().toISOString(),
        };

        // 如果需要保存证件号码到变量
        if (saveIdCode && idCodeVariable) {
          // 这里可以添加实际提取证件号码的逻辑
          // 目前先用占位符
          this.setVariable(idCodeVariable, 'EXTRACTED_ID_CODE');
        }

        return {
          data: config,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`套餐操作失败: ${error.message}`);
      }
    },
  };
}
