import { ToastContainer } from 'react-toastify';

const WonkToastContainer = () => {
  return (
    <ToastContainer
      position='top-center'
      autoClose={5000}
      hideProgressBar={false}
      newestOnTop={false}
      closeOnClick={true}
      rtl={false}
      draggable={true}
      pauseOnHover={true}
    />
  );
};

export default WonkToastContainer;
