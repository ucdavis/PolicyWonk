import Logo from '@/components/layout/logo';

const AboutPage = () => {
  return (
    <div className='container my-5 ms-5'>
      <div className='home-message'>
        <Logo />
      </div>
      <h1 className='text-center mb-5'>
        📘 PolicyWonk: UCD Policy Expert At Your Service!
      </h1>

      <p>
        Welcome to <strong>PolicyWonk</strong>, your app for navigating the
        complex maze of UCOP (University of California Office of the President)
        and UC Davis policies! Whether you're a student, faculty, staff, or
        administrator, understanding and complying with university policies is
        now easier than ever.
      </p>

      <h2>How Can PolicyWonk Assist You?</h2>
      <ul>
        <li>
          <strong>Immediate Answers:</strong> Got a policy question? Just ask,
          and PolicyWonk provides you with clear, concise answers, pronto!
        </li>
        <li>
          <strong>Intense Focus:</strong> Click on the focus bar to "focus" on
          different policy areas, such as the core UC/UCD policies, APM, Union
          Contracts, and more!
        </li>
        <li>
          <strong>Always Informed:</strong> PolicyWonk's database is updated
          regularly, ensuring you get the most current policy information.
        </li>
        <li>
          <strong>Simple to Use:</strong> Designed with user-friendliness in
          mind, PolicyWonk makes navigating policies as straightforward as
          chatting with a friend.
        </li>
      </ul>

      <h2>Sources:</h2>
      <ul>
        <li>
          <a href='https://policy.ucop.edu/'>UCOP Policies</a>
        </li>
        <li>
          <a href='https://manuals.ucdavis.edu/'>
            UC Davis Manuals (including PPM, PPSM & DA)
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
            UCD Public Knowledge Base (Service Now)
          </a>
        </li>
      </ul>

      <h2>Questions?</h2>
      <p>
        Questions about UC Davis policy content should be directed to the
        responsible department identified in the policy section. The Policy
        Owner is responsible for providing policy interpretation and guidance on
        the subject matter, including changes in laws, regulations, or
        systemwide policy that may not yet be reflected in policy. Questions
        about the content of delegations of authority should be directed to the
        delegator. Information or assistance on policy development, review, and
        approval process is available from the Administrative Policy Office at{' '}
        <a href='mailto:policy@ucdavis.edu'>policy@ucdavis.edu</a>.
      </p>

      <p>
        Embark on a hassle-free journey through university policies with
        PolicyWonk today! 📘🚀
      </p>
    </div>
  );
};

export default AboutPage;
