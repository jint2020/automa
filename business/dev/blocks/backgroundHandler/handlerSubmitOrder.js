/*
 * @Description: 订单提交块 Handler
 * @Author: Jin Tang
 * @Date: 2025-12-19
 */

export default function () {
  return {
    async submitOrder({ data, id }) {
      try {
        const {
          isPay,
          confirmSubmit,
          invalid,
          completed,
          skipPhoneNumberQuantityReview,
          waitTime,
          feedbackNo,
          waitTimeAfterSubmit,
          invalidKey,
          userName,
          isMinimalismOrderParam,
          variableMap,
          outboundAgents,
          outboundWorkNo,
          ifMandatoryReceipt,
        } = data;

        // 构建配置数据
        const config = {
          isPay: isPay || '0',
          confirmSubmit: confirmSubmit || false,
          invalid: invalid || false,
          completed: completed || false,
          skipPhoneNumberQuantityReview: skipPhoneNumberQuantityReview || false,
          waitTime: waitTime || 60,
          feedbackNo: feedbackNo || '申请单编码:reqNo',
          waitTimeAfterSubmit: waitTimeAfterSubmit || 0,
          invalidKey: invalidKey || [],
          userName: userName || '',
          isMinimalismOrderParam: isMinimalismOrderParam || '',
          variableMap: variableMap || [],
          outboundAgents: outboundAgents || false,
          outboundWorkNo: outboundWorkNo || '',
          ifMandatoryReceipt: ifMandatoryReceipt || '0',
          timestamp: new Date().toISOString(),
        };

        // 这里可以添加实际的业务逻辑
        // 例如：提交订单、处理弹窗、错误处理等

        return {
          data: config,
          nextBlockId: this.getBlockConnections(id),
        };
      } catch (error) {
        throw new Error(`订单提交失败: ${error.message}`);
      }
    },
  };
}
