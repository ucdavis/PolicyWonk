export const generateMetadata = () => {
  return {
    title: 'Disclaimer',
  };
};

const DisclaimerPage = () => {
  return (
    <div className='wonk-static-wrapper'>
      <div className='static-page-scroll'>
        <div className='static-page-wrapper'>
          <h1>Disclaimer</h1>
          <p>
            <b>PolicyWonk</b> provides information about policies as a service
            to users. Please read this important disclaimer regarding the use of
            our platform.
          </p>

          <h2>Information Accuracy</h2>
          <p>
            While we strive to ensure the accuracy and completeness of the
            information presented, we cannot guarantee that all information is
            current or error-free. The official policy documents should always
            be consulted for the most up-to-date and accurate information.
          </p>

          <h2>No Legal Advice</h2>
          <p>
            The information provided through PolicyWonk does not constitute
            legal advice and should not be relied upon as such. For specific
            questions regarding policy interpretation or application, please
            consult with the appropriate university department or legal counsel.
          </p>

          <h2>Limitation of Liability</h2>
          <p>
            PolicyWonk and its operators shall not be liable for any direct,
            indirect, incidental, special, or consequential damages arising out
            of the use of or inability to use this service.
          </p>

          <p>
            By using PolicyWonk, you acknowledge that you have read and
            understood this disclaimer.
          </p>
        </div>
      </div>
    </div>
  );
};

export default DisclaimerPage;
