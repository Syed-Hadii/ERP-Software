import VoucherList from "../../components/VoucherList";

const JournalVoucherList = () => {
  return (
    <VoucherList
      title="Journal Vouchers"
      voucherType="Journal"
      createLink="/journalvoucher/journalform"
    />
  );
};

export default JournalVoucherList;
