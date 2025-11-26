/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-11-26 11:35:53
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-11-26 11:36:08
 */
/**
 * CRM客户查询处理器
 * 在background context中执行
 */
export default async function (block, { refData }) {
  const { data } = block;

  return new Promise(async (resolve, reject) => {
    try {
      console.log('[CRM] 开始查询客户:', data);

      // 替换变量（如 {{customerId}}）
      const customerId = refData(data.customerId);
      const email = refData(data.email);
      const phone = refData(data.phone);
      const apiEndpoint = refData(data.apiEndpoint);
      const apiKey = refData(data.apiKey);

      // 构建查询参数
      let queryParams = new URLSearchParams();
      if (data.queryType === 'by-id' && customerId) {
        queryParams.append('id', customerId);
      } else if (data.queryType === 'by-email' && email) {
        queryParams.append('email', email);
      } else if (data.queryType === 'by-phone' && phone) {
        queryParams.append('phone', phone);
      }

      // 指定需要查询的字段
      if (data.fields && data.fields.length > 0) {
        queryParams.append('fields', data.fields.join(','));
      }

      // 发起API请求
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), data.timeout || 10000);

      const response = await fetch(`${apiEndpoint}?${queryParams.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`CRM API错误: ${response.status} ${response.statusText}`);
      }

      const customerData = await response.json();
      console.log('[CRM] 客户数据获取成功:', customerData);

      // 返回数据
      resolve({
        data: customerData,
        nextBlockId: block.id, // 继续执行下一个块
        // 如果需要保存到表格或变量
        insert: data.saveData ? [{
          [data.dataColumn]: customerData,
        }] : undefined,
        // 如果需要分配给变量
        vars: data.assignVariable ? {
          [data.variableName]: customerData,
        } : undefined,
      });

    } catch (error) {
      console.error('[CRM] 查询客户失败:', error);
      reject(new Error(`CRM查询失败: ${error.message}`));
    }
  });
}
