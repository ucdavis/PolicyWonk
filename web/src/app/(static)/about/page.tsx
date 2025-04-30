import Link from 'next/link';

import Logo from '../../../components/layout/logo';

export const generateMetadata = () => {
  return {
    title: 'About',
  };
};

const AboutPage = () => {
  return (
    <div>
      <div className='about-logo'>
        <Logo />
      </div>
      <h1>A UC Davis Policy Resource At Your Service!</h1>

      <p>
        Welcome to <b>PolicyWonk</b>, a tool for navigating UC Davis policies!
        Whether you're a student, faculty, staff, or administrator, finding
        university policies is now easier than ever.
      </p>

      <h2>How Can PolicyWonk Assist You?</h2>
      <ul>
        <li>
          <b>Immediate Answers:</b> Have a policy question? Just ask, and
          PolicyWonk will provide clear and concise answers promptly!
        </li>
        <li>
          <strong>Intense Focus:</strong> Click on the{' '}
          <Link href='/focus'>focus bar</Link> to explore different policy areas
          such as core UC/UC Davis policies, APM, Union Contracts, and more!
        </li>
        <li>
          <strong>Surface Resources:</strong> By identifying relevant policies,
          PolicyWonk can help you find the best department to contact for
          additional information, effectively bridging the gap between policy
          and people.
        </li>
      </ul>
      <p className='discreet'>
        The information provided by PolicyWonk is for general informational
        purposes only and is not considered official UC Davis interpretations of
        policy and/or legal advice. Always consult with the Responsible
        Department, Campus Policy Coordinator, or the Office of Campus Counsel
      </p>
      <hr />
      <h2>Using PolicyWonk</h2>
      <p>
        Use PolicyWonk by typing your question into the main textbox and then
        click "Send". By default PW will search its database of UC & UCD
        policies for an answer, but you can also{' '}
        <Link href='/focus'> click on the "Focus" bar</Link> to change your
        focus to other policies, procedures, contracts, and more.
      </p>
      <p>
        Never include any sensitive or personally identifiable information (PII)
        in your questions.
      </p>
      <p>
        Tips: Try to be specific when asking questions. For example, "Do staff
        need approval to work from home" is a better question that "can i work
        from home" (though both will get you solid answers). You can always
        click "ask another question" to try again.
      </p>
      <hr />
      <h2>Questions?</h2>
      <p>
        Questions about the PolicyWonk tool itself should be directed to its
        developers via{' '}
        <a href='https://caeshelp.ucdavis.edu/?appname=PolicyWonk'>
          The CA&ES Helpdesk
        </a>
      </p>
      <p>
        Questions about UC Davis policy content should be directed to the
        Responsible Department identified in the policy section. The Policy
        Owner is responsible for providing policy interpretation and guidance on
        the subject matter, including changes in laws, regulations, systemwide
        policy, or any other necessary changes that may not yet be reflected in
        policy. Questions about the content of delegations of authority should
        be directed to the delegator. Information or assistance on policy
        development, review, and approval process is available from the
        Administrative Policy Office at{' '}
        <a href='mailto:policy@ucdavis.edu'>policy@ucdavis.edu</a>.
      </p>
      <hr />
      <h2>Privacy</h2>
      <p>
        {' '}
        Below is a snippet of our privacy policy, for the complete version{' '}
        <Link href='/privacy'>click here.</Link>
      </p>
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
      <hr />
      <h2>Sources:</h2>
      <ul>
        <li>
          <a href='https://policy.ucop.edu/'>UC Policies</a>
        </li>
        <li>
          <a href='https://ucdavispolicy.ellucid.com/home'>
            UC Davis Administrative Policy Manuals (including PPM, PPSM & DA)
          </a>
        </li>
        <li>
          <a href='https://academicaffairs.ucdavis.edu/apm/apm-toc'>
            UC Davis Academic Personnel Manual (APM)
          </a>
        </li>
        <li>
          <a href='https://ucnet.universityofcalifornia.edu/resources/employment-policies-contracts/bargaining-units/'>
            UC Davis Bargaining Units and Contracts
          </a>
        </li>
        <li>
          <a href='https://kb.ucdavis.edu'>
            UC Davis Public Knowledge Base (Service Now)
          </a>
        </li>
      </ul>
      <hr />
      <p>
        Embark on a journey through university policies with PolicyWonk today!
      </p>
    </div>
  );
};

export default AboutPage;
