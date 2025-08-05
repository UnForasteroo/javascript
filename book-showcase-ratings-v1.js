import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('Book showcase ratings script started');
console.log('Vue:', typeof Vue !== 'undefined' ? 'Loaded' : 'Not loaded');
console.log('jQuery:', typeof $ !== 'undefined' ? 'Loaded' : 'Not loaded');

const supabase = createClient(
  'https://ogwhskbvowkkwdvtguwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2hza2J2b3dra3dkdnRndXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODI4NzAsImV4cCI6MjA2OTU1ODg3MH0.B-EjyhvIhce6BH5xRyb4cJe1gvkkD4B3i6z9mhRSyYg'
);

Vue.component("rating", {
  props: {
    rates: { type: Array, required: true },
    starCount: { type: Number, required: false, default: 5 },
    name: { type: String, required: false, default: "unnamed" },
    bookId: { type: String, required: true }
  },
  methods: {
    getRating: function() {
      return this.rates.length ? (this.rates.reduce((sum, rate) => sum + rate, 0) / this.rates.length).toFixed(1) : '0.0';
    },
    getVoterCount: function() {
      return this.rates.length;
    },
    getStarWidth: function() {
      const rating = parseFloat(this.rating);
      return (rating / this.starCount) * 100; 
    },
    uniqueRating: function() {
      const chars = ["abcdefghijklmnopqrstuvwxy", "ABCDEFGHIJKLMNOPQRSTUVWXY", "0123456789"];
      let res = "";
      for (let i = 0; i < 50; i++) {
        const ch_select = Math.floor(Math.random() * chars.length);
        const ch_select_length = Math.floor(Math.random() * chars[ch_select].length);
        res += chars[ch_select].charAt(ch_select_length);
      }
      return res;
    }
  },
  data: function() {
    return {
      rates: [],
      rating: '0.0',
      widgetID: this.uniqueRating()
    };
  },
  async created() {
    console.log(`Fetching ratings for book: ${this.bookId}`);
    const { data, error } = await supabase
      .from('book_ratings')
      .select('rating')
      .eq('book_id', this.bookId);
    if (error) {
      console.error(`Error fetching ratings for ${this.bookId}:`, error.message);
    } else {
      this.rates = data.map(r => r.rating);
      this.rating = this.getRating();
      console.log(`Ratings for ${this.bookId}:`, this.rates);
    }
  },
  template: `
    <div class="c-rating c-rating--small">
      <div class="c-rating__badge">{{rating}}</div>
      <div class="c-rating__display" aria-hidden="true">
        <span class="c-rating__stars c-rating__stars--background"></span>
        <span class="c-rating__stars" :style="{ width: getStarWidth() + '%' }"></span>
      </div>
      <div class="c-rating__count">({{getVoterCount()}} رای‌دهنده)</div>
    </div>
  `
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('Showcase DOM loaded');
  const apps = document.querySelectorAll('.book-showcase-widget .app');
  apps.forEach((app, index) => {
    console.log(`Mounting Vue instance ${index + 1}`);
    new Vue({ el: app });
  });
});
