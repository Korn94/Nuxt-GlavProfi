<template>
  <div class="container">
    <div class="blur-container">
      <div class="header-section">
        <h1 class="title">{{ caseData?.title || 'Портфолио' }}</h1>
        <h3 v-if="caseData?.category" class="category">{{ caseData.category }}</h3>
        <div class="divider"></div>
      </div>
      <p v-if="caseData?.address" class="description">{{ caseData.address }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps } from 'vue'

defineProps({
  caseData: {
    type: Object,
    default: null
  }
})
</script>

<style lang="scss" scoped>
.container {
  height: 80vh;
  display: flex;
  justify-content: center;
  align-items: center;

  // @media (max-width: 768px) {
  //   height: 60vh;
  // }

  .blur-container {
    background: rgba(136, 136, 136, 0.2);
    backdrop-filter: blur(10px);
    border-radius: 1rem;
    padding: 2.5rem;
    width: 600px;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    // margin: 14rem auto;
    margin: 0 5px;
    
    .header-section {
      position: relative;
      margin-bottom: 2.5rem;
      
      .divider {
        position: absolute;
        bottom: -0.75rem;
        left: 0;
        width: 80px;
        height: 4px;
        background: linear-gradient(90deg, #fff, rgba(255, 255, 255, 0.5));
      }
      
      h1 {
        -webkit-text-shadow: -2px 2px 5px #ffffff;
        -moz-text-shadow: -2px 2px 5px #ffffff;
        text-shadow: -2px 2px 5px #ffffff;
      }
      
      h3 {
        color: white;
      }
      
      .title {
        font-size: 3.2rem;
        line-height: 1.4;
        color: white;
        margin-bottom: 1.5rem;
        
        @media (max-width: 768px) {
          font-size: 1.6rem;
        }
      }
      
      .category {
        font-size: 1.5rem;
        color: white;
        margin-bottom: 1rem;
        
        @media (max-width: 768px) {
          font-size: 1.2rem;
        }
      }
    }
    
    .description {
      flex: 1;
      grid-column: span 2;
      font-size: 1.1rem;
      color: rgba(255, 255, 255, 0.95);
      margin-bottom: 2rem;
      font-weight: 500;

      @media (max-width: 768px) {
        font-size: 1rem;
      }
    }
    
    .main-content {
      .cta-section {
        grid-column: span 2;
        padding-top: 2rem;
        border-top: 1px solid rgba(255, 255, 255, 0.1);
        
        .call-to-action {
          font-size: 1.1rem;
          color: white;
          margin-bottom: 1.5rem;
          text-align: center;
          font-weight: 500;
        }
        
        .contact-buttons {
          display: flex;
          justify-content: center;
          gap: 1.5rem;
          
          @media (max-width: 576px) {
            flex-direction: column;
            align-items: center;
          }
          
          .btn {
            padding: 0.75rem 1.5rem;
            border-radius: 0.5rem;
            font-weight: 600;
            transition: all 0.3s ease;
            text-decoration: none;
            display: inline-block;
            text-align: center;
            
            &.primary {
              background: white;
              color: #111827;
              
              &:hover {
                background: #f3f4f6;
              }
            }
            
            &.secondary {
              background: transparent;
              color: white;
              border: 2px solid white;
              
              &:hover {
                background: rgba(255, 255, 255, 0.1);
              }
            }
          }
        }
      }
    }
  }
}
</style>