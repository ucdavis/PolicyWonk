import { redirect } from 'next/navigation';

import { isWonkSuccess } from '@/lib/error/error';
import { getChat } from '@/services/historyService';

const ChatHandler = async ({ params }: { params: { chatid: string } }) => {
  const { chatid } = params;

  if (chatid === 'new') {
    // Redirect to the new chat page
    redirect('/');
  }

  const chat = await getChat(chatid);

  if (isWonkSuccess(chat)) {
    redirect(`/${chat.data.group}/chat/${chatid}`);
  }

  // If the chat is not found, redirect to the home page
  return redirect('/');
};

export default ChatHandler;
