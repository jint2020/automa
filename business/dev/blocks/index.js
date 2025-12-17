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
import prodInfo from './editComponents/EditProdInfo/index'

export default function () {
  return {
    ...crmGetCustomerBlocks,
    ...loginBlocks,
    ...independentProdOrderBlocks,
    ...handleCRMAgent,
    ...moreProdConfig,
    ...prodInfo,
  };
}
