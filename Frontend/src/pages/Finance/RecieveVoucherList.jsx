import VoucherList from "../../components/VoucherList";

const ReceiveVoucherList = () => {
  return (
    <VoucherList
      title="Receipt Entries"
      voucherType="Receipt"
      createLink="/receivevoucher/recieveform"
      createLink="/receipt-entry/form"
    />
  );
};

export default ReceiveVoucherList;
