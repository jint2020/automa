/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-09 13:15:33
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-16 17:55:52
 */
import handlerCRMGetCustomer from './handlerCRMGetCustomer';
import handlerLogin from './handlerLogin';
import handlerIndependentProdOrder from './handlerIndependentProdOrder';
import handleCRMAgent from './handlerCRMAgent';

export default function () {
  return {
    ...handlerCRMGetCustomer(),
    ...handlerLogin(),
    ...handlerIndependentProdOrder(),
    ...handleCRMAgent(),
  };
}
