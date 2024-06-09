import { createClient } from '@supabase/supabase-js';

// Supabase client setup
const supabaseUrl = 'https://pbgazkitooxguqiskhac.supabase.co';
const supabaseKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBiZ2F6a2l0b294Z3VxaXNraGFjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNzg4NTk1OCwiZXhwIjoyMDMzNDYxOTU4fQ._Q-1afn2EwowpORsJhe9lES9i5jymSj8wpN_8hR9WS8';
export const supabase = createClient(supabaseUrl, supabaseKey);

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveText',
    title: 'Save to Wordpot',
    contexts: ['selection'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveText' && info.selectionText) {
    const selectedText = info.selectionText;

    try {
      const { data, error } = await supabase
        .from('words') // Store in 'words' table
        .insert([{ word: selectedText }]);

      if (error) {
        throw error;
      }

      console.log('Text saved:', data);

      // 성공적으로 저장되었음을 알리는 알림 생성
      chrome.notifications.create(
        {
          type: 'basic',
          iconUrl: 'icon-128.png', // 아이콘 파일 경로
          title: 'Wordpot',
          message: '텍스트가 성공적으로 저장되었습니다.',
        },
        (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Notification error:',
              chrome.runtime.lastError.message
            );
          } else {
            console.log('Notification shown:', notificationId);
          }
        }
      );
    } catch (error) {
      console.error('Error:', error);

      // 저장 실패 알림 생성
      chrome.notifications.create(
        {
          type: 'basic',
          iconUrl: 'icon-128.png', // 아이콘 파일 경로
          title: 'Wordpot',
          message: '텍스트 저장에 실패했습니다.',
        },
        (notificationId) => {
          if (chrome.runtime.lastError) {
            console.error(
              'Notification error:',
              chrome.runtime.lastError.message
            );
          } else {
            console.log('Notification shown:', notificationId);
          }
        }
      );
    }
  }
});
