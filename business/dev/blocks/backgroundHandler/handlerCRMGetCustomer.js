export default function () {
  return {
    // handler 名称使用 camelCase
    async crmGetCustomer({ data, id }) {
      try {
        // 获取用户配置的查询类型和查询参数
        const {
          queryType,
          queryParams,
          dataColumn,
          assignVariable,
          variableName,
        } = data;

        // 构建查询配置数据（这些数据已经保存在 workflow 节点中）
        const queryConfig = {
          queryType,
          queryParams,
          timestamp: new Date().toISOString(),
        };

        // 如果需要保存到表格列
        if (dataColumn) {
          await this.addDataToColumn(dataColumn, queryConfig);
        }

        // 如果需要赋值给变量
        if (assignVariable && variableName) {
          this.setVariable(variableName, queryConfig);
        }

        // 返回查询配置，传递给下一个 block
        return {
          data: queryConfig,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`CRM 查询配置失败: ${error.message}`);
      }
    },
  };
}
