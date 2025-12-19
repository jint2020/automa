/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-09 13:15:33
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-17 09:58:48
 */
import handlerCRMGetCustomer from './handlerCRMGetCustomer';
import handlerLogin from './handlerLogin';
import handlerIndependentProdOrder from './handlerIndependentProdOrder';
import handleCRMAgent from './handleCRMAgent';
import handleMoreProdConfig from './handleMoreProdConfig';
import handleProdInfo from './handleProdInfo';
import handlerPreferenceSetParam from './handlerPreferenceSetParam';
import handlerPackageOperate from './handlerPackageOperate';
import handlerPackageSubscription from './handlerPackageSubscription';
import handlerSubmitOrder from './handlerSubmitOrder';

export default function () {
  return {
    ...handlerCRMGetCustomer(),
    ...handlerLogin(),
    ...handlerIndependentProdOrder(),
    ...handleCRMAgent(),
    ...handleMoreProdConfig(),
    ...handleProdInfo(),
    ...handlerPreferenceSetParam(),
    ...handlerPackageOperate(),
    ...handlerPackageSubscription(),
    ...handlerSubmitOrder(),
  };
}
