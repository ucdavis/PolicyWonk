'use client';
import { Alert } from 'reactstrap';

interface WonkyClientErrorProps {
  type: 'text' | 'alert';
  thereWasAnErrorLoadingThe?: string;
  contactLink?: boolean;
}

/**
 * Renders an error message as the fallback UI for a component that has errored. This is for **client components**, not handling server errors.
 * @param type 'text' or 'alert'
 * @param thereWasAnErrorLoadingThe As in "There was an error loading the {componentName}". Defaults to "there was an error loading."
 * @param contactLink Whether to include a link to contact the developers
 */

export const WonkyComponentError: React.FC<WonkyClientErrorProps> = ({
  type,
  thereWasAnErrorLoadingThe: componentName,
  contactLink = false,
}) => {
  const errorContent = (
    <>
      {' '}
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
    </>
  );
  if (type === 'alert') {
    return <Alert color='danger'>{errorContent}</Alert>;
  }
  return <>{errorContent}</>;
};

export default WonkyComponentError;
