import { Alert } from 'reactstrap';

interface WonkyErrorProps {
  type: 'text' | 'alert';
  thereWasAnErrorLoadingThe?: string;
  contactLink?: boolean;
  message?: React.ReactNode;
}

/**
 *
 * @param type 'text' or 'alert'
 * @param thereWasAnErrorLoadingThe As in "There was an error loading the {componentName}". Defaults to "there was an error loading."
 * @param contactLink Whether to include a link to contact the developers
 * @param message Optional message to display at the end
 * @returns Error component
 */

const WonkyError: React.FC<WonkyErrorProps> = ({
  type,
  thereWasAnErrorLoadingThe: componentName,
  contactLink = false,
  message = null,
}) => {
  const errorText = (
    <>
      There was an error loading{componentName ? ` the ${componentName}` : ''}.
      Please refresh and try again.{' '}
      {contactLink && (
        <>
          <br />
          <br />
          If the problem persists, please{' '}
          <a href='https://caeshelp.ucdavis.edu/?appname=PolicyWonk'>
            contact the developers.
          </a>
        </>
      )}
      {message}
    </>
  );

  if (type === 'alert') {
    return <Alert color='warning'>{errorText}</Alert>;
  }

  return <>{errorText}</>;
};

export default WonkyError;
