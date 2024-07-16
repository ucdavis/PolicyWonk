import Image from 'next/image';

export const generateMetadata = () => {
  return {
    title: 'Focus',
  };
};

const FocusPage = () => {
  return (
    <div>
      <h1 className='display-6 fw-bold py-5'>
        Focus: Search over relevant policies
      </h1>
      <p>
        With <b>PolicyWonk</b> you can focus your search on specific policy
        areas by clicking the "Focus" bar.
      </p>

      <Image
        src='/media/focusbar.png'
        alt='Focus bar screenshot'
        width={943}
        height={77}
        className='my-3'
      />

      <p>
        Once a focus is selected, any question you ask will be answered with
        sources from that focus area. Clicking "ask another question" will
        retain your selected focus. You can always change your focus by clicking
        the "Focus" bar again.
      </p>

      <p>There are currently 4 focus areas available to choose from:</p>
      <h2>Core:</h2>
      <p>
        The core focus area includes UC & UC Davis Admin (PPM), Personnel
        (PPSM), Delegations of Authority (DA) Policies.
      </p>
      <ul>
        <li>
          <a href='https://policy.ucop.edu/'>UC Policies</a>
        </li>
        <li>
          <a href='https://ucdavispolicy.ellucid.com/home'>
            UC Davis Administrative Policy Manuals (including PPM, PPSM & DA)
          </a>
        </li>
      </ul>
      <h2>APM:</h2>
      <p>
        The Academic Personnel Manual (APM) is a compilation of policies
        covering academic personnel managed by Academic Affairs.
      </p>
      <ul>
        <li>
          <a href='https://academicaffairs.ucdavis.edu/apm/apm-toc'>
            UC Davis Academic Personnel Manual (APM)
          </a>
        </li>
      </ul>
      <h2>Bargaining Units:</h2>
      <p>
        The bargaining units focus area includes systemwide and local UC Davis
        bargaining units and contracts. This focus area requires selection of a
        specific bargaining unit before asking questions.
      </p>
      <ul>
        <li>
          <a href='https://ucnet.universityofcalifornia.edu/resources/employment-policies-contracts/bargaining-units/'>
            UC Davis Bargaining Units and Contracts
          </a>
        </li>
      </ul>
      <h2>Knowledgebase:</h2>
      <p>
        Managed and offered by Information and Educational Technology (IET), the
        Knowledge Base is a central repository of procedures, guides, training
        material, and other documentation.
      </p>
      <ul>
        <li>
          <a href='https://kb.ucdavis.edu'>
            UC Davis Public Knowledge Base (Service Now)
          </a>
        </li>
      </ul>
    </div>
  );
};

export default FocusPage;
