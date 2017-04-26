<template>
    <div class="status" :class="{ 'status-even': isEven, 'status-odd': !isEven }">
        <span class="avator"></span>
        <div class="header">
          <span class="left">
            <span class="account-username">{{ status.account.username }}</span>
            <span class="account-display_name">{{ status.account.display_name }}</span>
          </span>
          <span class="right">
            <span class="account-host">{{ status.account.host }}</span>
          </span>
        </div>
        <div class="content" v-html="status.content"></div>
        <div v-if="status.media_attachments.length !== 0" class="media"
             :style="mediaSize">
          <div v-for="(media, i) in status.media_attachments" :key="i"
               class="thumbnail"
               :style="mediaBackground(media)"></div>
        </div>
        <div class="footer">
          <span class="actions">
            <i class="action material-icons">chat_bubble_outline</i>
            <i class="action material-icons">cached</i>
            <i class="action material-icons">favorite_border</i>
            <i class="action material-icons" @click="copy(status)">content_copy</i>
          </span>
          <span class="created_at">{{ new Date(status.created_at).toLocaleString() }}</span>
        </div>
      </div>
</template>

<script>
import { clipboard } from 'electron';
export default {
  props: [ "status", "index", 'columnSize' ],
  computed: {
    isEven: function() {
      return this['index'] % 2 === 0;
    },
    mediaSize: function() {
      console.log(this.columnSize);
      let size = Math.min(300, this.columnSize.width) + 'px';
      return {
        'width': size,
        'height': size
      };
    }
  },
  methods: {
    log: status => console.log(status),
    copy: status => clipboard.writeText(JSON.stringify(status)),
    mediaBackground: function(media) {
      let width = 100 / this.status.media_attachments.length;
      return {
//          'width': (width * 0.9).toString() + '%',
          'background-image': `url(${media.preview_url})`,
          'background-repeat': 'no-repeat',
          'background-size': 'cover',
          'background-position': 'center middle'
      };
    }
  }
};
</script>