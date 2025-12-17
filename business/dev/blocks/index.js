/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-11-25 17:58:34
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-10 18:02:23
 */
import crmGetCustomerBlocks from './editComponents/EditCRMGetCustomer/index';
import loginBlocks from './editComponents/EditLogin/index';
import independentProdOrderBlocks from './editComponents/EditIndependentProdOrder/index';
import handleCRMAgent from './editComponents/EditCrmAgent/index';
import moreProdConfig from './editComponents/EditMoreProdConfig/index';

export default function () {
  return {
    // 导入 CRM 客户查询相关的块定义
    ...crmGetCustomerBlocks,
    // 导入登录处理相关的块定义
    ...loginBlocks,
    // 导入独立销售品订购相关的块定义
    ...independentProdOrderBlocks,
    ...handleCRMAgent,
    ...moreProdConfig,
  };
}
