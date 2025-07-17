import VoucherList from "../../components/VoucherList";

const PaymentVoucherList = () => {
  return (
    <VoucherList
      title="Payment Entries"
      voucherType="Payment"
      createLink="/payment-entry/form"
    />
  );
};

export default PaymentVoucherList;
