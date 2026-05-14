import VoucherList from "../../components/VoucherList";

const ReceiveVoucherList = () => {
  return (
    <VoucherList
      title="Receipt Entries"
      voucherType="Receipt"
      createLink="/receipt-entry/form"
    />
  );
};

export default ReceiveVoucherList;
