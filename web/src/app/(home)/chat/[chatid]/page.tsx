import { redirect } from 'next/navigation';

import { getChat } from '@/services/historyService';

const ChatHandler = async ({ params }: { params: { chatid: string } }) => {
  const { chatid } = params;

  const chat = await getChat(chatid);
  if (chat) {
    // TODO: determine group from chat
    redirect(`/ucdavis/chat/${chatid}`);
  }

  // If the chat is not found, redirect to the home page
  return redirect('/');
};

export default ChatHandler;
