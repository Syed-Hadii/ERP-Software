import Wrapper from "../utils/wrapper";

const Loading = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-white">
      <Wrapper.CircularProgress color="success" size={60} thickness={4} />
      <p className="ml-4 text-xl font-medium text-gray-700">Loading...</p>
    </div>
  );
};

export default Loading;
