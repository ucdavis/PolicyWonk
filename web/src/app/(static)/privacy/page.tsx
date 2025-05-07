export const generateMetadata = () => {
  return {
    title: 'Privacy Policy',
  };
};

const PrivacyPage = () => {
  return (
    <div className='wonk-static-wrapper'>
      <div className='static-page-scroll'>
        <div className='static-page-wrapper'>
          <h1>Privacy Policy</h1>

          <h2>Introduction</h2>
          <p>
            Welcome to PolicyWonk. We are committed to protecting your privacy
            and ensuring that your personal information is handled responsibly.
            This Privacy Policy outlines the types of data we collect, how we
            store and use that data, and your rights regarding your information.
            By using our web application, you consent to the practices described
            in this policy and the{' '}
            <a
              href='https://www.ucdavis.edu/privacy-and-accessibility'
              rel='noreferrer noopener'
            >
              UC Davis Web Privacy Policy
            </a>
            .
          </p>

          <h2>Data Collection, Usage, and Sharing</h2>

          <h3>Automatic Data Collection</h3>
          <p>
            We may automatically collect information about how you use our web
            application, such as the number of visits to our pages, device &
            browser information, and page actions. This data is aggregated and
            does not identify any individual user. We use this data to track its
            use and improve our service. We do not use cookies or other tracking
            technologies for targeting or advertising purposes.
          </p>
          <p>
            We also collect and transmit questions that you ask PolicyWonk to
            provide this service. The question is automatically sent to a
            third-party service provider, OpenAI Chat GPT. This processing
            activity is governed by an agreement that restricts training the AI
            model or retaining information that it receives.
          </p>

          <h3>Chat History</h3>
          <p>
            <strong>Storage:</strong> We securely store your chat history using
            industry-standard encryption methods. All chat data is stored in a
            manner that ensures only you can access it unless you explicitly
            choose to "share" a chat.
          </p>
          <p>
            <strong>Sharing:</strong> If you choose to share a chat, the shared
            chat will be accessible to the recipient. You can revoke sharing at
            any time, after which the chat will no longer be accessible to
            anyone but you.
          </p>

          <h2>Data Security</h2>
          <p>
            We take data security seriously and implement technical and
            organizational measures to protect your data against unauthorized
            access, alteration, disclosure, or destruction. These measures
            include, but are not limited to, encryption, access controls, and
            secure hosting environments.
          </p>

          <h2>Changes to this Policy</h2>
          <p>
            We may update this Privacy Policy from time to time to reflect
            changes in our practices or for other operational, legal, or
            regulatory reasons. Any changes will be effective immediately upon
            posting the updated Privacy Policy on our web application. Your
            continued use of the web application following the posting of
            changes constitutes your acceptance of such changes.
          </p>

          <h2>Choices & Questions</h2>
          <p>
            You may choose not to visit or use our web application at any time.
            You may choose to share or remove access to your chat history at any
            time. Questions about this Policy should be directed to its
            developers via{' '}
            <a href='https://caeshelp.ucdavis.edu/?appname=PolicyWonk'>
              The CA&ES Helpdesk
            </a>
          </p>

          <h2>Conclusion</h2>
          <p>
            Thank you for trusting PolicyWonk with your information. We are
            committed to protecting your privacy and providing a secure and
            reliable service.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
