import { Alert } from 'reactstrap';

interface WonkyErrorProps {
  type: 'text' | 'alert';
  message?: React.ReactNode;
  thereWasAnErrorLoadingThe?: string; // as in, "There was an error loading the form" where "form" is the componentName
}

const WonkyError: React.FC<WonkyErrorProps> = ({
  type,
  message,
  thereWasAnErrorLoadingThe: componentName,
}) => {
  const errorText = (
    <>
      There was an error loading the{componentName ? ` ${componentName}` : ''}.
      Please refresh and try again.
      {message && <>{message}</>}
    </>
  );

  if (type === 'alert') {
    return <Alert color='warning'>{errorText}</Alert>;
  }

  return <>{errorText}</>;
};

export default WonkyError;
