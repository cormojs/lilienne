<template>
    <div class="status">
        <span class="status-avator"></span>
        <div class="status-header">
          <span class="account-username">@{{ status.account.username }}</span>
          <span class="account-display_name">{{ status.account.display_name }}</span>
        </div>
        <div class="status-content" v-html="status.content"></div>
        <div class="status-media">
          <div v-for="(media, i) in status.media_attachments" :key="i" class="media-thumbnail"
               :style="{ 'background': 'url(' + media.preview_url + ') no-repeat'}"></div>
        </div>
        <div class="status-footer">
          <span class="status-actions">
            <i class="material-icons">chat_bubble_outline</i>
            <i class="material-icons">cached</i>
            <i class="material-icons">favorite_border</i>
            <i class="material-icons" @click="copy(status)">content_copy</i>
          </span>
          <span class="status-created_at">{{ new Date(status.created_at).toLocaleString() }}</span>
        </div>
      </div>
</template>

<script>
import { clipboard } from 'electron';
export default {
  props: [ "status" ],
  methods: {
    log: status => console.log(status),
    copy: status => clipboard.writeText(JSON.stringify(status))
  }
};
</script>