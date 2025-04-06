<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { deepClone } from '@vue/devtools-shared'
import { InputField, Label } from '~/components/ui/form'
import { Button } from '~/components/ui/button'
import { Input } from '~/components/ui/input'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Switch } from '~/components/ui/switch'

const { useUpdateSpaceMutation } = useSpaces()
const { mutate: updateSpace } = useUpdateSpaceMutation()

const props = defineProps<{ space: SpaceResource }>()

const environments = ref(deepClone(props.space.settings.environments ?? []))
const visualEditorEnabled = ref(props.space.settings.visual_editor)

const newEnvName = ref('')
const newEnvUrl = ref('')

const addEnvironment = () => {
  if (newEnvName.value && newEnvUrl.value) {
    if (!Array.isArray(environments.value)) {
      environments.value = []
    }
    environments.value.push({
      name: newEnvName.value,
      url: newEnvUrl.value
    })
    newEnvName.value = ''
    newEnvUrl.value = ''
  }
}

const removeEnvironment = (id: string) => {
  environments.value = environments.value.filter(env => env.id !== id)
}

const openInTab = (url: string) => {
  window.open(url, '_blank')
}

const saveSettings = async () => {
  updateSpace({
    id: props.space.id,
    payload: {
      settings: {
        ...props.space.settings,
        environments: environments.value,
        visual_editor: visualEditorEnabled.value
      }
    }
  })
}
</script>

<template>
  <Card variant="outline">
    <CardHeader>
      <CardTitle>{{ $t('labels.settings.editor.title') }}</CardTitle>
      <CardDescription>{{ $t('labels.settings.editor.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <div>
            <h4 class="text-sm font-medium">{{ $t('labels.settings.editor.environments') }}</h4>
            <p class="text-xs text-muted">{{ $t('labels.settings.editor.environmentsDescription') }}</p>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t('labels.settings.editor.name') }}</TableHead>
              <TableHead>{{ $t('labels.settings.editor.url') }}</TableHead>
              <TableHead class="w-[50px]"/>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="env in environments"
              :key="env.url"
            >
              <TableCell>
                <InputField
                  v-model="env.name"
                  name="name"
                />
              </TableCell>
              <TableCell>
                <InputField
                  v-model="env.url"
                  name="url"
                />
              </TableCell>
              <TableCell class="flex">
                <Button
                  variant="ghost"
                  size="icon"
                  @click="openInTab(env.url)"
                >
                  <Icon name="lucide:external-link"/>
                  <span class="sr-only">{{ $t('actions.open') }}</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="removeEnvironment(env.id)"
                >
                  <Icon name="lucide:trash"/>
                  <span class="sr-only">{{ $t('actions.remove') }}</span>
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Input
                  v-model="newEnvName"
                  :placeholder="$t('labels.settings.editor.namePlaceholder')"
                  @keydown.enter="addEnvironment"
                />
              </TableCell>
              <TableCell>
                <Input
                  v-model="newEnvUrl"
                  :placeholder="$t('labels.settings.editor.urlPlaceholder')"
                  @keydown.enter="addEnvironment"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  :disabled="!newEnvName || !newEnvUrl"
                  @click="addEnvironment"
                >
                  <Icon
                    name="lucide:plus"
                    class="h-4 w-4"
                  />
                  <span class="sr-only">{{ $t('actions.add') }}</span>
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="space-y-4">
        <div>
          <h4 class="text-sm font-medium">{{ $t('labels.settings.editor.visualEditor') }}</h4>
          <p class="text-xs text-muted">{{ $t('labels.settings.editor.visualEditorDescription') }}</p>
        </div>

        <div class="flex items-center space-x-2">
          <Switch
            id="visual-editor"
            v-model="visualEditorEnabled"
            aria-label="Enable Visual Editor"
          />
          <Label
            for="visual-editor"
            class="text-sm font-medium"
            :label="$t('labels.settings.editor.enableVisualEditor')"
          />
        </div>
        <p class="text-xs text-muted">
          {{ $t('labels.settings.editor.visualEditorInfo') }}
        </p>
      </div>
    </CardContent>
    <CardFooter>
      <Button
        variant="primary"
        @click="saveSettings"
      >{{ $t('actions.saveChanges') }}
      </Button>
    </CardFooter>
  </Card>
</template>