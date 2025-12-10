/*
 * @Description:
 * @Author: Jin Tang
 * @Date: 2025-12-09 13:15:33
 * @LastEditors: Jin Tang
 * @LastEditTime: 2025-12-10 18:05:46
 */
import handlerCRMGetCustomer from './handlerCRMGetCustomer';
import handlerLogin from './handlerLogin';
import handlerIndependentProdOrder from './handlerIndependentProdOrder';

export default function () {
  return {
    ...handlerCRMGetCustomer(),
    ...handlerLogin(),
    ...handlerIndependentProdOrder(),
  };
}
