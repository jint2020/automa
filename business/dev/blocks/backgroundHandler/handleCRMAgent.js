/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-16 17:42:41
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-17 08:56:10
 */
export default function () {
  return {
    async crmAgent({ data, id }) {
      try {
        const {
          // 基本信息
          linkMan,
          linkPhone,
          orderRemark,
          bookTime,
          // 经办人信息
          handlerType,
          handlerFindType,
          handlerFindValue,
          // 携带人信息
          isHandlerCarryMan,
          carryManFindType,
          carryManFindValue,
          carryManFindType1,
          carryManFindValue1,
          carryManFindType2,
          carryManFindValue2,
          // 其他配置
          convertToZeroSignalControl,
          // 变量配置
          assignVariable,
          variableName,
        } = data;

        // 构建经办人信息配置对象，只包含用户勾选的字段
        const agentConfig = {
          timestamp: new Date().toISOString(),
        };

        // 添加基本信息字段（如果勾选）
        if (linkMan) agentConfig.linkMan = linkMan;
        if (linkPhone) agentConfig.linkPhone = linkPhone;
        if (orderRemark) agentConfig.orderRemark = orderRemark;
        if (bookTime) agentConfig.bookTime = bookTime;

        // 添加经办人信息字段（如果勾选）
        if (handlerType) agentConfig.handlerType = handlerType;
        if (handlerFindType) agentConfig.handlerFindType = handlerFindType;
        if (handlerFindValue) agentConfig.handlerFindValue = handlerFindValue;

        // 添加携带人信息字段（如果勾选）
        if (isHandlerCarryMan)
          agentConfig.isHandlerCarryMan = isHandlerCarryMan;
        if (carryManFindType) agentConfig.carryManFindType = carryManFindType;
        if (carryManFindValue)
          agentConfig.carryManFindValue = carryManFindValue;
        if (carryManFindType1)
          agentConfig.carryManFindType1 = carryManFindType1;
        if (carryManFindValue1)
          agentConfig.carryManFindValue1 = carryManFindValue1;
        if (carryManFindType2)
          agentConfig.carryManFindType2 = carryManFindType2;
        if (carryManFindValue2)
          agentConfig.carryManFindValue2 = carryManFindValue2;

        // 添加其他配置字段（如果勾选）
        if (convertToZeroSignalControl) {
          agentConfig.convertToZeroSignalControl = convertToZeroSignalControl;
        }

        // 保存到变量
        if (assignVariable && variableName) {
          this.setVariable(variableName, agentConfig);
        }

        // 返回结果给下一个节点
        return {
          data: agentConfig,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`CRM 经办人配置失败: ${error.message}`);
      }
    },
  };
}
