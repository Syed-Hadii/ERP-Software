import VoucherList from "../../components/VoucherList";

const PaymentVoucherList = () => {
  return (
    <VoucherList
      title="Payment Entries"
      voucherType="Payment"
      createLink="/paymentvoucher/paymentform"
    />
  );
};

export default PaymentVoucherList;
