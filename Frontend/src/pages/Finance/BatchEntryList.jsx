import VoucherList from "../../components/VoucherList";

const BatchVoucherListPage = () => {
  return (
    <VoucherList
      title="Batch Entries"
      voucherType="Batch"
      createLink="/batch-entry/form"
      isBatch={true}
    />
  );
};

export default BatchVoucherListPage;
