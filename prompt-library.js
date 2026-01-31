document.addEventListener('DOMContentLoaded', () => {
  const promptList = document.getElementById('prompt-list');
  const promptForm = document.getElementById('prompt-form');
  
  if (!promptList || !promptForm) {
    return;
  }

  const promptText = document.getElementById('prompt-text');
  const authorName = document.getElementById('author-name');
  const submitButton = promptForm.querySelector('button[type="submit"]');

  const getLikedPrompts = () => {
    const liked = localStorage.getItem('liked_prompts');
    return liked ? JSON.parse(liked) : [];
  };

  const saveLikedPrompt = (promptId) => {
    const liked = getLikedPrompts();
    if (!liked.includes(promptId)) {
      localStorage.setItem('liked_prompts', JSON.stringify([...liked, promptId]));
    }
  };

  const removeLikedPrompt = (promptId) => {
    let liked = getLikedPrompts();
    liked = liked.filter(id => id !== promptId);
    localStorage.setItem('liked_prompts', JSON.stringify(liked));
  };

  const fetchPrompts = async () => {
    const { data: prompts, error } = await window.supabaseClient
      .from('prompts')
      .select('*')
      .order('likes', { ascending: false }) // Primary sort: by likes descending
      .order('created_at', { ascending: false }); // Secondary sort: by created_at descending

    if (error) {
      console.error('Error fetching prompts:', error);
      promptList.innerHTML = '<p style="color: red;">프롬프트를 불러오는 중 오류가 발생했습니다. Supabase 설정 및 RLS 정책을 확인해주세요.</p>';
      return;
    }

    if (prompts.length === 0) {
      promptList.innerHTML = '<p>아직 공유된 프롬프트가 없습니다. 첫 번째 프롬프트를 공유해보세요!</p>';
      return;
    }

    const likedPrompts = getLikedPrompts();
    promptList.innerHTML = prompts.map(prompt => {
      const isLiked = likedPrompts.includes(prompt.id);
      return `
        <div class="prompt-card">
          <p style="white-space: pre-wrap;">${prompt.prompt_text}</p>
          <div class="prompt-meta">
            <span><strong>작성자:</strong> ${prompt.author_name || '익명'}</span>
            <div class="like-section">
              <button class="like-btn ${isLiked ? 'liked' : ''}" data-id="${prompt.id}" data-likes="${prompt.likes}">
                ${isLiked ? '❤️' : '👍'}
              </button>
              <span>${prompt.likes}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  };

  const addPrompt = async (e) => {
    e.preventDefault();
    submitButton.disabled = true;
    submitButton.textContent = '공유 중...';

    const newPrompt = promptText.value;
    const newAuthor = authorName.value;

    if (!newPrompt.trim()) {
        alert('프롬프트 내용을 입력해주세요.');
        submitButton.disabled = false;
        submitButton.textContent = '공유하기';
        return;
    }

    const { error } = await window.supabaseClient
      .from('prompts')
      .insert([{ prompt_text: newPrompt, author_name: newAuthor }]);

    if (error) {
      console.error('Error adding prompt:', error);
      alert(`프롬프트 공유에 실패했습니다: ${error.message}`);
    } else {
      promptText.value = '';
      authorName.value = '';
      await fetchPrompts();
    }

    submitButton.disabled = false;
    submitButton.textContent = '공유하기';
  };

  const toggleLike = async (e) => {
    const likeButton = e.target.closest('.like-btn');
    if (!likeButton) return;

    likeButton.disabled = true; // Disable button to prevent spamming

    const promptId = likeButton.dataset.id;
    const likedPrompts = getLikedPrompts();
    const isLiked = likedPrompts.includes(promptId);
    const currentLikes = parseInt(likeButton.dataset.likes, 10);
    
    const likeCountSpan = likeButton.nextElementSibling;
    let newLikes, newIsLiked;

    if (isLiked) {
      // --- Unlike logic ---
      newLikes = currentLikes - 1;
      newIsLiked = false;
      likeButton.innerHTML = '👍';
      likeButton.classList.remove('liked');
      removeLikedPrompt(promptId);
    } else {
      // --- Like logic ---
      newLikes = currentLikes + 1;
      newIsLiked = true;
      likeButton.innerHTML = '❤️';
      likeButton.classList.add('liked');
      saveLikedPrompt(promptId);
    }
    
    likeCountSpan.textContent = newLikes;
    likeButton.dataset.likes = newLikes;

    const { error } = await window.supabaseClient
      .from('prompts')
      .update({ likes: newLikes })
      .eq('id', promptId);

    if (error) {
      console.error('Error toggling like:', error);
      // Revert UI on error
      likeCountSpan.textContent = currentLikes;
      likeButton.dataset.likes = currentLikes;
      likeButton.innerHTML = isLiked ? '❤️' : '👍';
      likeButton.classList.toggle('liked', isLiked);
      
      if (newIsLiked) saveLikedPrompt(promptId); // If it was a like, re-add to localStorage
      else removeLikedPrompt(promptId); // If it was an unlike, re-remove from localStorage
      
      alert(`요청 처리에 실패했습니다: ${error.message}`);
    }
    
    setTimeout(() => {
        likeButton.disabled = false;
    }, 300); // Re-enable after a short delay
  };

  promptForm.addEventListener('submit', addPrompt);
  promptList.addEventListener('click', toggleLike);
  
  const navLinks = document.querySelectorAll('.nav-link');
  const libraryView = document.querySelector('#content-examples');
  
  const isLibraryViewActive = () => libraryView.classList.contains('active');

  if (isLibraryViewActive()) {
    fetchPrompts();
  }

  navLinks.forEach(link => {
    if (link.dataset.content === 'examples') {
      link.addEventListener('click', () => {
        if (!isLibraryViewActive()) {
          setTimeout(fetchPrompts, 50); 
        }
      });
    }
  });
});