import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

console.log('Book page ratings script started');
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
    getStarValue: function(e, attr) {
      return parseInt(e.target.attributes[attr].value);
    },
    setRatingValue: function(value, options) {
      options = options || { removeClass: true };
      const $value = $(`#w-${this.widgetID} .rating__value`);
      if (options.removeClass) {
        $value.removeClass("rating__value--binding");
      } else {
        $value.addClass("rating__value--binding");
      }
      $value.children(".number").html(value).siblings(".number__animation").html(value);
    },
    hasTargetAttr: function(e, attr) {
      return typeof(e.target.attributes[attr]) !== "undefined";
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
    },
    starOff: function() {
      $(`#w-${this.widgetID} .star`).removeClass("active");
      this.setRatingValue(this.getRating());
    },
    starOn: function(e, x) {
      $(`#w-${this.widgetID} .star`).removeClass("active");
      const is_index = this.hasTargetAttr(e, "data-index");
      const is_index_half = this.hasTargetAttr(e, "data-index-half");
      for (let i = 1; i <= x; i++) {
        if (is_index) {
          $(`#w-${this.widgetID} .star[data-index-half=${i}]`).addClass("active");
          $(`#w-${this.widgetID} .star[data-index=${i}]`).addClass("active");
          this.setRatingValue(this.getStarValue(e, "data-index").toFixed(1), { removeClass: false });
        } else if (is_index_half) {
          $(`#w-${this.widgetID} .star[data-index-half=${i}]`).addClass("active");
          $(`#w-${this.widgetID} .star[data-index=${i - 1}]`).addClass("active");
          this.setRatingValue((this.getStarValue(e, "data-index-half") - 0.5).toFixed(1), { removeClass: false });
        }
      }
    },
    rate: async function(e) {
      let currentRating = 0;
      if (this.hasTargetAttr(e, "data-index")) {
        currentRating = this.getStarValue(e, "data-index");
      } else if (this.hasTargetAttr(e, "data-index-half")) {
        currentRating = this.getStarValue(e, "data-index-half") - 0.5;
      }

      let userId = localStorage.getItem('user_id');
      if (!userId) {
        userId = crypto.randomUUID();
        localStorage.setItem('user_id', userId);
      }

      const { data: existingRating, error: checkError } = await supabase
        .from('book_ratings')
        .select('id')
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
          .update({ rating: currentRating })
          .eq('id', existingRating.id);
        if (error) {
          console.error('Error updating rating:', error.message);
        } else {
          console.log(`Updated rating for ${this.bookId}: ${currentRating}`);
        }
      } else {
        const { error } = await supabase
          .from('book_ratings')
          .insert([{ book_id: this.bookId, user_id: userId, rating: currentRating }]);
        if (error) {
          console.error('Error inserting rating:', error.message);
        } else {
          console.log(`Rated ${this.bookId}: ${currentRating}`);
        }
      }

      const { data, error } = await supabase
        .from('book_ratings')
        .select('rating')
        .eq('book_id', this.bookId);
      if (error) {
        console.error('Error fetching ratings:', error.message);
        return;
      }

      this.rates = data.map(r => r.rating);
      this.rating = this.getRating();

      $(`#w-${this.widgetID} .number__animation`)
        .addClass("number__animation--bounce");
      setTimeout(() => {
        $(`#w-${this.widgetID} .number__animation`)
          .removeClass("number__animation--bounce");
      }, 300);
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
    <div class="rating" :id="'w-' + widgetID">
      <div class="stars">
        <template v-for="x in starCount">
          <div class="star__wrapper"
               v-on:mouseover="starOn($event, x)"
               v-on:mouseleave="starOff()"
               v-on:click="rate($event)">
            <span class="star"
                  :class="{ selected: x - 1 < rating }"
                  :data-index-half="x"></span>
            <span class="star"
                  :class="{ selected: x <= rating }"
                  :data-index="x"></span>
          </div>
        </template>
      </div>
      <div class="rating__value">
        <div class="number">{{rating}}</div>
        <div class="number__animation">{{rating}}</div>
      </div>
    </div>
  `
});

document.addEventListener('DOMContentLoaded', () => {
  console.log('Book page DOM loaded');
  const app = document.querySelector('#rating-app');
  if (app) {
    new Vue({ el: '#rating-app' });
  } else {
    console.error('Rating app element not found');
  }
});
