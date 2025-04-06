<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { FormField } from '~/components/ui/form'
import { Input } from '~/components/ui/input'
import { deepClone } from '@vue/devtools-shared'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { Button } from '~/components/ui/button'

const { useUpdateSpaceMutation } = useSpaces()
const { mutate: updateSpace } = useUpdateSpaceMutation()

const props = defineProps<{ space: SpaceResource }>()

const languages = ref(deepClone(props.space.settings.languages))
const defaultLanguage = ref(props.space.settings.default_language)

const newLangCode = ref('')
const newLangName = ref('')

const addLanguage = () => {
  if (newLangCode.value && newLangName.value) {
    if (!Array.isArray(languages.value)) {
      languages.value = []
    }
    languages.value.push({
      code: newLangCode.value,
      name: newLangName.value
    })
    newLangCode.value = ''
    newLangName.value = ''
  }
}

const removeLanguage = (code: string) => {
  languages.value = languages.value.filter(lang => lang.code !== code)
}

const saveSettings = async () => {
  updateSpace({
    id: props.space.id,
    payload: {
      settings: {
        ...props.space.settings,
        languages: languages.value,
        default_language: defaultLanguage.value
      }
    }
  })
}
</script>

<template>
  <Card variant="outline">
    <CardHeader>
      <CardTitle>{{ $t('labels.settings.i18n.title') }}</CardTitle>
      <CardDescription>{{ $t('labels.settings.i18n.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-4">
      <FormField
        name="defaultLanguage"
        :label="$t('labels.settings.i18n.defaultLanguage')"
        :description="$t('labels.settings.i18n.defaultLanguageDescription')"
      >
        <Input
          v-model="defaultLanguage"
          :placeholder="$t('labels.settings.i18n.defaultLanguagePlaceholder')"
        />
      </FormField>
      <div>
        <h4 class="text-sm font-medium mb-2">{{ $t('labels.settings.i18n.languages') }}</h4>
        <p class="text-xs text-muted mb-4">
          {{ $t('labels.settings.i18n.languagesDescription') }}
        </p>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t('labels.settings.i18n.code') }}</TableHead>
              <TableHead>
                {{ $t('labels.settings.i18n.label') }}
              </TableHead>
              <TableHead class="w-[50px]"/>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="lang in languages"
              :key="lang.code"
            >
              <TableCell class="font-mono">{{ lang.code }}</TableCell>
              <TableCell>
                <Input
                  v-model="lang.name"
                  name="name"
                  :placeholder="$t('labels.settings.i18n.label')"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  @click="removeLanguage(lang.code)"
                >
                  <Icon
                    name="lucide:trash"
                    class="h-4 w-4"
                  />
                  <span class="sr-only">{{ $t('actions.remove') }}</span>
                </Button>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <Input
                  v-model="newLangCode"
                  :placeholder="$t('labels.settings.i18n.codePlaceholder')"
                  maxlength="5"
                  @keydown.enter="addLanguage"
                />
              </TableCell>
              <TableCell>
                <Input
                  v-model="newLangName"
                  :placeholder="$t('labels.settings.i18n.labelPlaceholder')"
                  @keydown.enter="addLanguage"
                />
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="icon"
                  :disabled="!newLangCode || !newLangName"
                  @click="addLanguage"
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