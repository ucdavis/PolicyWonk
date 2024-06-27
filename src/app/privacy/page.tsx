export const generateMetadata = () => {
  return {
    title: 'Privacy Policy',
  };
};

const PrivacyPage = () => {
  return (
    <div>
      <h1>Privacy Policy</h1>
      <h2>Introduction</h2>
      <p>
        Welcome to PolicyWonk. We are committed to protecting your privacy and
        ensuring that your personal information is handled responsibly. This
        Privacy Policy outlines the types of data we collect, how we store and
        use that data, and your rights regarding your information. By using our
        web application, you consent to the practices described in this policy.
      </p>

      <h2>Data Collection and Usage</h2>
      <p>
        <b>Chat History</b>
        <br />
        <b>Storage: </b>
        We securely store your chat history using industry-standard encryption
        methods. All chat data is stored in a manner that ensures only you can
        access it unless you explicitly choose to "share" a chat.
        <br />
        <b>Sharing: </b>
        If you choose to share a chat, the shared chat will be accessible to the
        recipient. You can revoke sharing at any time, after which the chat will
        no longer be accessible to anyone but you.
      </p>
      <p>
        <b>Anonymous Tracking</b>
        <br />
        We track site usage anonymously to improve our services. The information
        collected may include the number of visits and the pages visited. This
        data is aggregated and does not identify any individual user. We do not
        use cookies or other tracking technologies for targeting or advertising
        purposes.
      </p>
      <p>
        <b>OpenAI ChatGPT</b>
        <br />
        <b>Anonymity: </b>
        Your questions are sent to OpenAI ChatGPT anonymously. This means no
        personally identifiable information is attached to your queries.
        <br />
        <b>Data Retention: </b>
        None of your data sent to OpenAI is ever retained by OpenAI or used for
        future training of any OpenAI models. This practice is governed by the
        UC-wide OpenAI contract.
      </p>
      <p>
        <b>Data Security</b>
        <br />
        We take data security seriously and implement technical and
        organizational measures to protect your data against unauthorized
        access, alteration, disclosure, or destruction. These measures include,
        but are not limited to, encryption, access controls, and secure hosting
        environments.
      </p>
      <h2>Changes to this Policy</h2>
      <p>
        We may update this Privacy Policy from time to time to reflect changes
        in our practices or for other operational, legal, or regulatory reasons.
        Any changes will be effective immediately upon posting the updated
        Privacy Policy on our web application. Your continued use of the web
        application following the posting of changes constitutes your acceptance
        of such changes.
      </p>
      <h2>Conclusion</h2>
      <p>
        Thank you for trusting PolicyWonk with your information. We are
        committed to protecting your privacy and providing a secure and reliable
        service.
      </p>
    </div>
  );
};

export default PrivacyPage;
