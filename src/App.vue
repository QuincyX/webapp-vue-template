<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

import ToastContainer from '@/components/ui/ToastContainer.vue'
import AuthLayout from '@/layouts/AuthLayout.vue'
import DefaultLayout from '@/layouts/DefaultLayout.vue'

const route = useRoute()
const layout = computed(() => (route.meta.layout === 'auth' ? AuthLayout : DefaultLayout))
</script>

<template>
  <component :is="layout" />
  <ToastContainer />
</template>
