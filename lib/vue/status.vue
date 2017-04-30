<template>
  <div class="status" :class="styles">
    <div class="avatar" :style="avatarStyle(actual)"></div>
    <div class="header">
      <span class="left">
                <span class="account-username">{{ actual.account.username }}</span>
      <span class="account-display_name">{{ actual.account.display_name }}</span>
      </span>
      <span class="right">
                <span class="account-host">{{ actual.account.host }}</span>
      </span>
    </div>
    <div class="content" v-html="actual.contentSanitized"></div>
    <div v-if="actual.media_attachments.length !== 0" class="media">
      <template v-for="(media, i) in actual.media_attachments">
        <div class="thumbnail-container">
          <div class="thumbnail" :style="thumbnailStyle(media)"></div>
        </div>
      </template>
    </div>
    <div class="footer">
      <span class="actions">
                <i class="action material-icons">chat_bubble_outline</i>
                <i class="action material-icons">cached</i>
                <i class="action material-icons" @click="fav(actual)">favorite_border</i>
                <i class="action material-icons" @click="copy(status)">content_copy</i>
              </span>
      <span class="created_at">{{ new Date(actual.created_at).toLocaleString() }}</span>
    </div>
  </div>
</template>

<script>
import { clipboard } from 'electron';
export default {
  props: ["status", "index", 'columnSize'],
  data: function () {
    return {
      bigMediaMode: true
    };
  },
  computed: {
    actual() {
      return this.status.actual;
    },
    mediaSize() {
      return this.bigMediaMode ? 300 : 150;
    },
    styles() {
      let isEven = this.index % 2 === 0;
      return {
        'status-even': isEven,
        'status-odd': !isEven,
        'status-big-media': this.bigMediaMode
      };
    }
  },
  methods: {
    avatarStyle: function (s) {
      console.log("avator", s);
      return {
        'background-image': `url(${s.account.avatar_static})`,
        'background-repeat': 'no-repeat',
        'background-size': 'cover'
      };
    },
    log() {
      console.log(this.status);
    },
    copy(s) {
      clipboard.writeText(JSON.stringify(s));
    },
    thumbnailStyle: function (media) {
      return {
        //          'width': (width * 0.9).toString() + '%',
        'background-image': `url(${media.preview_url})`,
        'background-repeat': 'no-repeat',
        'background-size': 'contain',
        'background-position': 'center center',
        // 'width': this.mediaSize + 'px',
        // 'height': this.mediaSize + 'px',
      };
    },
    fav(s) {
      let m = this.$parent.$parent.app.mastodon(this.$parent.column.source.connection);
      console.log("fav'ing", m);
      m
        .post("statuses/:id/favourite", { id: s.id })
        .catch(err => console.error(err))
        .then(data => console.log("faved"));
    }
  }
};
</script>