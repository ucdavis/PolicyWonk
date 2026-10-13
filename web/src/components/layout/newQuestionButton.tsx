'use client';

import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { usePathname, useRouter } from 'next/navigation';

import { getGroupFromPathname } from '@/lib/groups';

import { useCollapsibleSidebar } from './collapsibleSidebarProvider';
import { useNewQuestionNavigation } from './newQuestionNavigationProvider';

const NewQuestionButton = () => {
  const pathname = usePathname();
  const router = useRouter();
  const group = getGroupFromPathname(pathname);
  const { onNavigate } = useCollapsibleSidebar();
  const { requestNewQuestion } = useNewQuestionNavigation();
  const chatHref = `/${group}/chat/new`;

  const navigateToNewQuestion = () => {
    onNavigate(() => router.push(chatHref));
  };

  return (
    <div className='px-4 pb-1'>
      <button
        type='button'
        className='btn btn-primary btn-block'
        onClick={() => {
          if (!requestNewQuestion(navigateToNewQuestion)) {
            navigateToNewQuestion();
          }
        }}
      >
        <FontAwesomeIcon icon={faPenToSquare} />
        New question
      </button>
    </div>
  );
};

export default NewQuestionButton;
