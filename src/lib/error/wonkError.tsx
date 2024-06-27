import { Alert } from 'reactstrap';

interface WonkErrorProps {
  type: 'text' | 'alert';
  message?: string;
  componentName?: string; // as in, "There was an error loading the form" where "form" is the componentName
}

const WonkError: React.FC<WonkErrorProps> = ({
  type,
  message,
  componentName,
}) => {
  const errorText =
    message ||
    `There was an error loading the${componentName ? ` ${componentName}` : ''}. Please refresh and try again.`;

  if (type === 'alert') {
    return <Alert color='warning'>{errorText}</Alert>;
  }

  return <>{errorText}</>;
};

export default WonkError;
