import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('Book page script started at', new Date().toLocaleString());

const supabase = createClient(
  'https://ogwhskbvowkkwdvtguwx.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9nd2hza2J2b3dra3dkdnRndXd4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5ODI4NzAsImV4cCI6MjA2OTU1ODg3MH0.B-EjyhvIhce6BH5xRyb4cJe1gvkkD4B3i6z9mhRSyYg'
);

Vue.component("rating-display", {
  props: {
    bookId: { type: String, required: true }
  },
  data() {
    return {
      averageRating: 0,
      userRating: 0,
      showUserVote: true,
      popupVisible: false,
      hoverRating: 0 // For hover effect
    };
  },
  methods: {
    async fetchRatings() {
      const { data: userRatingData, error: userError } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('book_id', this.bookId)
        .eq('user_id', localStorage.getItem('user_id') || crypto.randomUUID())
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('Error fetching user rating:', userError.message);
      } else if (userRatingData) {
        this.userRating = userRatingData.rating;
      }

      const { data, error } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('book_id', this.bookId);
      if (error) {
        console.error('Error fetching average ratings:', error.message);
      } else {
        this.averageRating = data.length ? (data.reduce((sum, r) => sum + r.rating, 0) / data.length).toFixed(1) : 0;
      }
      this.$nextTick(() => {
        this.updateStars(this.showUserVote ? this.userRating : this.averageRating, this.$el.querySelectorAll('.stars.active .star'));
      });
    },
    async rate(rating) {
      let userId = localStorage.getItem('user_id');
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('user_id', userId);
      }

      const { data: existingRating, error: checkError } = await supabase
        .from('book_ratings')
        .select('id, rating')
        .eq('book_id', this.bookId)
        .eq('user_id', userId)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('Error checking rating:', checkError.message);
        return;
      }

      if (existingRating) {
        const { error } = await supabase
          .from('book_ratings')
          .update({ rating })
          .eq('id', existingRating.id);
        if (error) console.error('Error updating rating:', error.message);
      } else {
        const { error } = await supabase
          .from('book_ratings')
          .insert([{ book_id: this.bookId, user_id: userId, rating }]);
        if (error) console.error('Error inserting rating:', error.message);
      }

      this.userRating = rating;
      this.showPopup();
      this.updateStars(this.userRating, this.$el.querySelectorAll('.user-stars .star'));
      await this.fetchRatings();
    },
    updateStars(rating, stars) {
      stars.forEach(star => {
        const value = parseInt(star.dataset.value || star.getAttribute('data-value'));
        star.classList.toggle('filled', value <= rating);
      });
    },
    toggleView(type) {
      this.showUserVote = type === 'user';
      this.hoverRating = 0;
      this.$nextTick(() => {
        this.updateStars(this.showUserVote ? this.userRating : this.averageRating, this.$el.querySelectorAll('.stars.active .star'));
      });
    },
    showPopup() {
      this.popupVisible = true;
      setTimeout(() => { this.popupVisible = false; }, 2000);
    },
    onStarHover(index) {
      this.hoverRating = index;
      this.updateStars(this.hoverRating, this.$el.querySelectorAll('.user-stars .star'));
    },
    onStarLeave() {
      this.hoverRating = 0;
      this.updateStars(this.userRating, this.$el.querySelectorAll('.user-stars .star'));
    },
    getDisplayRating() {
      return this.showUserVote ? this.userRating : this.averageRating;
    }
  },
  computed: {
    activeRating() {
      return this.showUserVote ? this.userRating : this.averageRating;
    }
  },
  created() {
    this.fetchRatings();
  },
  mounted() {
    const userStars = this.$el.querySelectorAll('.user-stars .star');
    userStars.forEach((star, index) => {
      star.addEventListener('click', () => this.rate(parseInt(star.dataset.value)));
      star.addEventListener('mouseover', () => this.onStarHover(parseInt(star.dataset.value)));
      star.addEventListener('mouseleave', this.onStarLeave);
    });
    this.updateStars(this.averageRating, this.$el.querySelectorAll('.avg-stars .star'));
  },
  template: `
    <div class="rating-container">
      <div class="c-rating__badge" :style="{ backgroundColor: showUserVote ? '#EFB523' : '#f8c264' }">
        {{ getDisplayRating() }} <!-- Added () to invoke the method -->
      </div>
      <div class="rating-toggle">
        <div class="stars user-stars" :class="{ 'active': showUserVote }">
          <span v-for="n in 5" :key="n" :data-value="n" class="star">&#9733;</span>
        </div>
        <div class="stars avg-stars" :class="{ 'active': !showUserVote }">
          <span v-for="n in 5" :key="n" :data-value="n" :class="{ 'filled': n <= averageRating }" class="star">&#9733;</span>
        </div>
        <div class="rating-labels">
          <span class="label user-label" :class="{ 'active': showUserVote }" @click="toggleView('user')">رای شما</span>
          <span class="divider-line"></span>
          <span class="label avg-label" :class="{ 'active': !showUserVote }" @click="toggleView('avg')">میانگین</span>
        </div>
      </div>
      <div v-if="popupVisible" class="rating-popup">رای شما ثبت شد</div>
    </div>
  `
});

new Vue({
  el: ".app"
});
