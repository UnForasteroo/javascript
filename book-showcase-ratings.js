import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('Book showcase ratings script started');

const supabase = createClient(
  'https://ogwhskbvowkkwdvtguwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2hza2J2b3dra3dkdnRndXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODI4NzAsImV4cCI6MjA2OTU1ODg3MH0.B-EjyhvIhce6BH5xRyb4cJe1gvkkD4B3i6z9mhRSyYg'
);

document.addEventListener('DOMContentLoaded', async function() {
  console.log('Showcase DOM loaded');

  const books = document.querySelectorAll('.book-showcase-widget .book');
  for (const book of books) {
    const bookId = book.dataset.bookId;
    const ratingContainer = book.nextElementSibling.querySelector('.c-rating');
    const badge = ratingContainer.querySelector('.c-rating__badge');
    const stars = ratingContainer.querySelector('.c-rating__stars:not(.c-rating__stars--background)');
    const count = ratingContainer.querySelector('.c-rating__count');

    // Fetch and display average rating
    const { data, error } = await supabase
      .from('book_ratings')
      .select('rating')
      .eq('book_id', bookId);
    if (error) {
      console.error(`Error fetching ratings for ${bookId}:`, error.message);
      continue;
    }
    if (data.length > 0) {
      const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
      badge.textContent = avg.toFixed(1);
      stars.style.width = `calc(100% * (${avg} / 5))`;
      count.textContent = `(${data.length} رای‌دهنده)`;
    } else {
      badge.textContent = '0.0';
      stars.style.width = '0%';
      count.textContent = '(0 رای‌دهنده)';
    }
  }
});
