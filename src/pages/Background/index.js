import { createClient } from '@supabase/supabase-js';

import OpenAI from 'openai';

const openai = new OpenAI({
  organization: 'org-r8nkt0isUpvKUxHfFAjVoJ2Q',
  project: 'proj_7NX9Lr0Vk5k5lyXv4xxd7CDo',
  apiKey: process.env.OPENAI_KEY,
});

// Supabase client setup
const supabaseUrl = 'https://pbgazkitooxguqiskhac.supabase.co';
const supabaseKey = process.env.SUPERBASE_KEY;
export const supabase = createClient(supabaseUrl, supabaseKey);

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'saveText',
    title: 'Save to Wordpot',
    contexts: ['selection'],
  });
});

const createImage = async (selectedText) => {
  const response = await openai.images.generate({
    model: 'dall-e-2',
    prompt: `Generate an image for the word: ${selectedText}`,
    n: 1,
    size: '1024x1024',
  });
  const image_url = response.data[0].url;
  return image_url;
};

const getMeaning = async (selectedText) => {
  const meaningResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      { role: 'system', content: 'You are a translator.' },
      {
        role: 'user',
        content: `Translate it to Korean for the word: ${selectedText}`,
      },
    ],
  });

  const meaning = meaningResponse.choices[0].message.content;

  return meaning;
};

async function getEtymologyInKorean(selectedText) {
  // Step 1: Get the etymology
  const etymologyResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are an etymology expert.',
      },
      {
        role: 'user',
        content: `Provide the etymology for the word: ${selectedText}`,
      },
    ],
  });

  const etymologyText = etymologyResponse.choices[0].message.content;

  // Step 2: Translate the etymology to Korean
  const translationResponse = await openai.chat.completions.create({
    model: 'gpt-3.5-turbo',
    messages: [
      {
        role: 'system',
        content: 'You are a translation expert.',
      },
      {
        role: 'user',
        content: `Translate the following text to Korean: ${etymologyText}`,
      },
    ],
  });

  const koreanTranslation = translationResponse.choices[0].message.content;

  return koreanTranslation;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'saveText' && info.selectionText) {
    const selectedText = info.selectionText;

    try {
      // const imageUrl = await createImage(selectedText);
      // console.log(imageUrl);

      const meaning = await getMeaning(selectedText);
      const etymology = await getEtymologyInKorean(selectedText);

      const { data, error } = await supabase
        .from('words') // Store in 'words' table
        .insert([{ word: selectedText, meaning, etymology }]);

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
