import Link from 'next/link';

const AboutPage = () => {
  return (
    <div className='container my-5 ms-5'>
      <h1 className='text-center mb-5'>
        📘 PolicyWonk: UCD Policy Expert At Your Service!
      </h1>

      <p>
        Welcome to <strong>PolicyWonk</strong>, your app for navigating the
        complex maze of UCOP (University of California Office of the President)
        and UC Davis policies! 🌟 Whether you're a student, faculty, staff, or
        administrator, understanding and complying with university policies is
        now easier than ever.
      </p>

      <h2>How Can PolicyWonk Assist You?</h2>
      <ul>
        <li>
          <strong>Immediate Answers:</strong> Got a policy question? Just ask,
          and PolicyWonk provides you with clear, concise answers, pronto! ✏️
        </li>
        <li>
          <strong>Always Informed:</strong> PolicyWonk's database is updated
          weekly, ensuring you get the most current policy information. 📅
        </li>
        <li>
          <strong>Simple to Use:</strong> Designed with user-friendliness in
          mind, PolicyWonk makes navigating policies as straightforward as
          chatting with a friend. 🤝
        </li>
      </ul>

      <h3>Features:</h3>
      <ul>
        <li>
          <strong>Direct Access to Policy Information:</strong>
          Every answer from PolicyWonk contains citations to the relevant
          policies, including links to the official policy documents for further
          reading.
        </li>
        <li>More coming soon!</li>
      </ul>

      <h3>How to Get Started?</h3>
      <p>
        To interact with PolicyWonk, simply start a chat with{' '}
        <Link href='/'>Policy Wonk</Link> and ask it any policy-related
        question. For example: <code>What are the official holidays?</code>
      </p>

      <h4>Sources:</h4>
      <ul>
        <li>
          <Link href='https://policy.ucop.edu/'>UCOP Policies</Link>
        </li>
        <li>
          <Link href='https://manuals.ucdavis.edu/'>
            UC Davis Manuals (including PPM, PPSM & DA)
          </Link>
        </li>
        <li>[Coming Soon] Union Contracts</li>
      </ul>

      <p>
        Embark on a hassle-free journey through university policies with
        PolicyWonk today! 📘🚀
      </p>
    </div>
  );
};

export default AboutPage;
