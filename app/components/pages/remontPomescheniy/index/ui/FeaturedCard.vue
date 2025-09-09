<template>
  <router-link :to="`/projects/${slug}`" class="featured-card-link">
    <div class="featured-card">
      <div class="image-container">
        <img :src="image" :alt="title" class="featured-image" loading="lazy" />
      </div>
      <div class="overlay">
        <p>{{ space }} м²</p>
        <h3>{{ title }}</h3>
        <Icon name="weui:arrow-filled" size="24px" />
      </div>
    </div>
  </router-link>
</template>

<script setup>
defineProps({
  slug: String,
  image: String,
  title: String,
  space: Number
})
</script>

<style scoped lang="scss">
.featured-card {
  position: relative;
  border-radius: 4px;
  overflow: hidden;
  height: 280px;
  max-width: 600px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  cursor: pointer;

  &:hover .featured-image {
    transform: scale(1.05);
  }

  .image-container {
    width: 100%;
    height: 100%;
    overflow: hidden;

    .featured-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.4s ease;
      transform-origin: center;
    }
  }

  .overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    background: linear-gradient(to bottom, rgba(0, 0, 0, 0.7) 40%, rgba(0, 0, 0, 0) 100%);
    border-top-left-radius: 4px;
    border-top-right-radius: 4px;
    color: white;
    padding: 20px;
    height: 160px;
    display: flex;
    justify-content: space-between;
    z-index: 2;

    p {
      color: white;
      font-weight: 600;
      margin: 0;
    }

    h3 {
      font-size: 1.25rem;
      margin: 0 0 0.75rem 0;
      line-height: 1.3;
    }
  }
}
</style>