import { supabase } from './supabase-client.js';

const promptList = document.getElementById('prompt-list');
const promptForm = document.getElementById('prompt-form');
const promptText = document.getElementById('prompt-text');
const authorName = document.getElementById('author-name');

const fetchPrompts = async () => {
  const { data: prompts, error } = await supabase
    .from('prompts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching prompts:', error);
    return;
  }

  promptList.innerHTML = prompts.map(prompt => `
    <div class="prompt-card">
      <p>${prompt.prompt_text}</p>
      <div class="prompt-meta">
        <span><strong>작성자:</strong> ${prompt.author_name || '익명'}</span>
        <span><strong>작성일:</strong> ${new Date(prompt.created_at).toLocaleDateString()}</span>
        <div class="like-section">
          <button class="like-btn" data-id="${prompt.id}" data-likes="${prompt.likes}">👍</button>
          <span>${prompt.likes}</span>
        </div>
      </div>
    </div>
  `).join('');
};

const addPrompt = async (e) => {
  e.preventDefault();
  const newPrompt = promptText.value;
  const newAuthor = authorName.value;

  const { error } = await supabase
    .from('prompts')
    .insert([{ prompt_text: newPrompt, author_name: newAuthor }]);

  if (error) {
    console.error('Error adding prompt:', error);
  } else {
    promptText.value = '';
    authorName.value = '';
    fetchPrompts();
  }
};

const likePrompt = async (e) => {
  if (!e.target.classList.contains('like-btn')) return;

  const promptId = e.target.dataset.id;
  const currentLikes = parseInt(e.target.dataset.likes, 10);

  const { error } = await supabase
    .from('prompts')
    .update({ likes: currentLikes + 1 })
    .eq('id', promptId);

  if (error) {
    console.error('Error liking prompt:', error);
  } else {
    fetchPrompts();
  }
};

promptForm.addEventListener('submit', addPrompt);
promptList.addEventListener('click', likePrompt);

// Fetch prompts on initial load
fetchPrompts();