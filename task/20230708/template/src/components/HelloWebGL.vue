<script setup>
import { ref, onMounted } from 'vue'
import { useWebGL } from '../composable/useWebGL';

const canvas = ref(null)


onMounted(() => {
  console.log(canvas.value)
  const { init } = useWebGL(canvas.value)
  init()
})

</script>

<template>
  <canvas ref="canvas"></canvas>
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
