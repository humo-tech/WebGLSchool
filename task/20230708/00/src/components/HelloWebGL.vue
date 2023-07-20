<script setup>
import { ref, onMounted, watch } from 'vue'
import { useWebGL } from '../composable/useWebGL';

let webgl = {}
const canvas = ref(null)
const vertexNumber = ref(5)


onMounted(() => {
  webgl = useWebGL(canvas.value)
  webgl.init(vertexNumber.value)
})

watch(vertexNumber, (newValue) => {
  webgl.changeVertexNumber(newValue)
})

</script>

<template>
  <canvas ref="canvas"></canvas>
  <input type="number" min="3" max="128" v-model.number="vertexNumber">
</template>

<style scoped>
.read-the-docs {
  color: #888;
}
</style>
