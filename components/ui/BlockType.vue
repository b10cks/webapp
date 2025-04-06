<script setup lang="ts">

interface BlockType {
  cls: string
  icon?: string
  text?: string
}

const types: Record<string, BlockType> = {
  'blocks': { cls: 'text-violet-300 border border-violet-400 bg-violet-800', icon: 'lucide:infinity' },
  'boolean': { cls: 'text-green-400 border border-green-600 bg-green-800', icon: 'lucide:toggle-right' },
  'link': { cls: 'text-blue-400 border border-accent bg-blue-900', icon: 'lucide:link' },
  'reference': { cls: 'text-blue-400 border border-accent bg-blue-900', icon: 'lucide:link-2' },
  'number': { cls: 'text-green-400 border border-green-600 bg-green-800', icon: 'lucide:hash' },
  'text': { cls: 'text-green-400 border border-green-600 bg-green-800', text: 'Aa' },
  'textarea': { cls: 'text-green-400 border border-green-600 bg-green-800', text: 'Tx' },
  'markdown': { cls: 'text-green-400 border border-green-600 bg-green-800', text: 'Md' },
  'option': { cls: 'text-violet-300 border border-violet-400 bg-violet-800', icon: 'lucide:rectangle-ellipsis' },
  'options': { cls: 'text-violet-300 border border-violet-400 bg-violet-800', icon: 'lucide:square-menu' },
  'asset': { cls: 'text-yellow-300 border border-yellow-400 bg-yellow-800', icon: 'lucide:image' },
  'multiAsset': { cls: 'text-yellow-300 border border-yellow-400 bg-yellow-800', icon: 'lucide:images' },
}

const props = defineProps<{ type: keyof typeof types }>()

const currentType = computed(() => {
  return types[props.type]
})

</script>

<template>
  <span :class="['h-6 w-10 justify-center rounded-sm flex items-center', currentType.cls]">
    <Icon
      v-if="currentType.icon"
      :name="currentType.icon"
    />
    <span
      v-else
      class="text-sm font-bold"
    >{{ currentType.text }}</span>
  </span>
</template>