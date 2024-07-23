import { toast } from 'react-toastify';

interface WonkToastMessage {
  type: 'success' | 'error' | 'warning';
  message?: string;
}

/**
 *
 * @param type - 'success', 'error', or 'warning'
 * @param message - the message to display, defaults to 'There was an error completing your request.'
 */
const addWonkToast = ({
  type,
  message = 'There was an error completing your request.',
}: WonkToastMessage) => {
  toast[type](message);
};

export default addWonkToast;
