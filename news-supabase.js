import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('Script started');

const supabase = createClient(
  'https://ogwhskbvowkkwdvtguwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2hza2J2b3dra3dkdnRndXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODI4NzAsImV4cCI6MjA2OTU1ODg3MH0.B-EjyhvIhce6BH5xRyb4cJe1gvkkD4B3i6z9mhRSyYg'
);

document.addEventListener('DOMContentLoaded', async function() {
  console.log('DOM loaded');

  let userId = localStorage.getItem('user_id');
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem('user_id', userId);
  }
  console.log('User ID:', userId);

  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) console.error('Auth error:', authError.message);
  if (user) {
    userId = user.id;
    console.log('Authenticated user:', userId);
  }

  if (!document.getElementById('login-prompt')) {
    const loginPrompt = document.createElement('div');
    loginPrompt.id = 'login-prompt';
    loginPrompt.style.display = 'none';
    loginPrompt.style.background = '#e0e0e0';
    loginPrompt.style.padding = '10px';
    loginPrompt.style.borderRadius = '10px';
    loginPrompt.style.textAlign = 'center';
    loginPrompt.style.position = 'fixed';
    loginPrompt.style.top = '20px';
    loginPrompt.style.right = '20px';
    loginPrompt.style.zIndex = '1000';
    loginPrompt.innerHTML = '<p>برای برخی اقدامات، لطفاً <a href="/login">وارد شوید</a> یا <a href="/signup">ثبت‌نام کنید</a>.</p>';
    document.body.appendChild(loginPrompt);
  }

  function showLoginPrompt() {
    const loginPrompt = document.getElementById('login-prompt');
    loginPrompt.style.display = 'block';
    setTimeout(() => loginPrompt.style.display = 'none', 5000);
    console.log('Login prompt shown');
  }

  async function fetchViewCount(articleId, viewBtn) {
    try {
      console.log(`Fetching view count for article: ${articleId}`);
      const { count, error } = await supabase
        .from('views')
        .select('id', { count: 'exact', head: true })
        .eq('article_id', articleId);
      if (error) throw error;
      const span = viewBtn.querySelector('span');
      if (!span) {
        console.error(`No span found in bookmark-btn for article: ${articleId}`);
        return;
      }
      span.textContent = count || 0;
      console.log(`Fetched view count for ${articleId}: ${count || 0}`);
    } catch (error) {
      console.error(`fetchViewCount error for ${articleId}:`, error.message);
    }
  }

  async function checkUserView(articleId, userId) {
    try {
      const { data, error } = await supabase
        .from('views')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', userId);
      if (error) throw error;
      console.log(`Checked view for ${articleId}, user ${userId}: ${data.length > 0}`);
      return data.length > 0;
    } catch (error) {
      console.error('checkUserView error:', error.message);
      return false;
    }
  }

  async function fetchLikeCount(articleId, heartBtn) {
    try {
      console.log(`Fetching like count for article: ${articleId}`);
      const { count, error } = await supabase
        .from('likes')
        .select('id', { count: 'exact', head: true })
        .eq('article_id', articleId);
      if (error) throw error;
      const span = heartBtn.querySelector('span');
      if (!span) {
        console.error(`No span found in heart-btn for article: ${articleId}`);
        return;
      }
      span.textContent = count || 0;
      console.log(`Fetched like count for ${articleId}: ${count || 0}`);
    } catch (error) {
      console.error('fetchLikeCount error:', error.message);
    }
  }

  async function checkUserLike(articleId, userId) {
    try {
      const { data, error } = await supabase
        .from('likes')
        .select('id')
        .eq('article_id', articleId)
        .eq('user_id', userId);
      if (error) throw error;
      console.log(`Checked like for ${articleId}, user ${userId}: ${data.length > 0}`);
      return data.length > 0;
    } catch (error) {
      console.error('checkUserLike error:', error.message);
      return false;
    }
  }

  async function toggleLike(heartBtn, articleId, userId) {
    try {
      const isLiked = heartBtn.classList.contains('active');
      const countSpan = heartBtn.querySelector('span');
      const icon = heartBtn.querySelector('i');
      const wasActive = isLiked;
      const increment = wasActive ? -1 : 1;
      const newCount = parseInt(countSpan.textContent) + increment;

      heartBtn.classList.toggle('active');
      countSpan.textContent = newCount;
      icon.classList.toggle('fa-solid', !wasActive);
      icon.classList.toggle('fa-regular', wasActive);
      console.log(`Optimistic like update: ${articleId}, active: ${!wasActive}`);

      if (isLiked) {
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('article_id', articleId)
          .eq('user_id', userId);
        if (error) throw error;
        console.log(`Unliked article ${articleId} by user ${userId}`);
      } else {
        const { error } = await supabase
          .from('likes')
          .insert([{ article_id: articleId, user_id: userId }]);
        if (error) throw error;
        console.log(`Liked article ${articleId} by user ${userId}`);
      }

      const userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');
      userLikes[articleId] = !wasActive;
      localStorage.setItem('userLikes', JSON.stringify(userLikes));
    } catch (error) {
      console.error('toggleLike error:', error.message);
      heartBtn.classList.toggle('active');
      countSpan.textContent = parseInt(countSpan.textContent) - increment;
      icon.classList.toggle('fa-solid', wasActive);
      icon.classList.toggle('fa-regular', !wasActive);
      alert('خطا در پردازش لایک: ' + error.message);
    }
  }

  document.querySelectorAll('.card .heart-btn').forEach(async (btn) => {
    const card = btn.closest('.card');
    const link = card.querySelector('.title a');
    if (!link) {
      console.error('No title link found for heart-btn:', btn);
      return;
    }
    const articleId = link.getAttribute('href').split('/').filter(Boolean).pop().split('.')[0];
    console.log(`Initializing heart button for article: ${articleId}`);
    await fetchLikeCount(articleId, btn);

    const userLikes = JSON.parse(localStorage.getItem('userLikes') || '{}');
    const hasLiked = await checkUserLike(articleId, userId);
    if (hasLiked) {
      btn.classList.add('active');
      btn.querySelector('i').classList.remove('fa-regular');
      btn.querySelector('i').classList.add('fa-solid');
      userLikes[articleId] = true;
    } else {
      btn.classList.remove('active');
      btn.querySelector('i').classList.remove('fa-solid');
      btn.querySelector('i').classList.add('fa-regular');
      delete userLikes[articleId];
    }
    localStorage.setItem('userLikes', JSON.stringify(userLikes));

    btn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log(`Like button clicked for ${articleId}`);
      await toggleLike(btn, articleId, userId);
    });
  });

  document.querySelectorAll('.card .bookmark-btn').forEach(async (btn) => {
    const card = btn.closest('.card');
    const link = card.querySelector('.title a');
    if (!link) {
      console.error('No title link found for bookmark-btn:', btn);
      return;
    }
    const articleId = link.getAttribute('href').split('/').filter(Boolean).pop().split('.')[0];
    console.log(`Initializing view count for article: ${articleId}`);
    await fetchViewCount(articleId, btn);

    btn.style.cursor = 'default';
    btn.querySelector('i').classList.remove('fa-regular', 'fa-bookmark');
    btn.querySelector('i').classList.add('fa-solid', 'fa-eye');
  });

  document.querySelectorAll('.card .btn-neumorphic').forEach(async (btn) => {
    const articleId = btn.getAttribute('href').split('/').filter(Boolean).pop().split('.')[0];
    const viewBtn = btn.closest('.card').querySelector('.bookmark-btn');

    const hasViewed = await checkUserView(articleId, userId);
    if (hasViewed) {
      btn.dataset.viewed = 'true';
    }

    btn.addEventListener('click', async (e) => {
      if (btn.dataset.viewed === 'true') return;
      try {
        const { error } = await supabase
          .from('views')
          .insert([{ article_id: articleId, user_id: userId }]);
        if (error) throw error;
        console.log(`View recorded for ${articleId} by user ${userId}`);
        btn.dataset.viewed = 'true';
        await fetchViewCount(articleId, viewBtn);
      } catch (error) {
        console.error('View count error:', error.message);
      }
    });
  });

  document.querySelectorAll('.card .share-btn').forEach(btn => {
    const popout = document.createElement('div');
    popout.className = 'share-popout';
    const card = btn.closest('.card');
    const readMoreLink = card.querySelector('.btn-neumorphic').getAttribute('href');
    const title = card.querySelector('.title a').textContent;
    const shareText = encodeURIComponent(`${title} - ${readMoreLink}`);
    popout.innerHTML = `
      <a href="https://twitter.com/intent/tweet?text=${shareText}" target="_blank" class="x-btn" aria-label="Share on X">
        <i class="fab fa-x-twitter"></i>
      </a>
      <a href="https://t.me/share/url?url=${encodeURIComponent(readMoreLink)}&text=${encodeURIComponent(title)}" target="_blank" class="telegram-btn" aria-label="Share on Telegram">
        <i class="fab fa-telegram-plane"></i>
      </a>
      <a href="https://wa.me/?text=${shareText}" target="_blank" class="whatsapp-btn" aria-label="Share on WhatsApp">
        <i class="fab fa-whatsapp"></i>
      </a>
      <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(readMoreLink)}" target="_blank" class="facebook-btn" aria-label="Share on Facebook">
        <i class="fab fa-facebook-f"></i>
      </a>
    `;
    btn.parentNode.insertBefore(popout, btn.nextSibling);
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      document.querySelectorAll('.share-popout').forEach(p => {
        if (p !== popout) p.classList.remove('active');
      });
      popout.classList.toggle('active');
      console.log('Share button clicked, popout toggled');
    });
  });

  document.addEventListener('click', () => {
    document.querySelectorAll('.share-popout').forEach(popout => {
      popout.classList.remove('active');
    });
  });

  document.querySelectorAll('.share-popout').forEach(popout => {
    popout.addEventListener('click', (e) => e.stopPropagation());
  });

  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('login-email').value;
      const password = document.getElementById('login-password').value;
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        console.log('User logged in:', data.user);
        alert('ورود موفق! در حال انتقال...');
        window.location.href = '/';
      } catch (error) {
        console.error('Login error:', error.message);
        alert('خطا در ورود: ' + error.message);
      }
    });
  }

  const signupForm = document.getElementById('signup-form');
  if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = document.getElementById('signup-email').value;
      const password = document.getElementById('signup-password').value;
      try {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        console.log('User signed up:', data.user);
        alert('ثبت‌نام موفق! لطفاً ایمیل خود را تأیید کنید.');
        window.location.href = '/login';
      } catch (error) {
        console.error('Signup error:', error.message);
        alert('خطا در ثبت‌نام: ' + error.message);
      }
    });
  }
});
