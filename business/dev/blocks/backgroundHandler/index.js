import handlerCRMGetCustomer from './handlerCRMGetCustomer';
import handlerLogin from './handlerLogin';

export default function () {
  return {
    ...handlerCRMGetCustomer(),
    ...handlerLogin(),
  };
}
