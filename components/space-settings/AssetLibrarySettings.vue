<script setup lang="ts">
import { ref } from 'vue'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card'
import { Input } from '~/components/ui/input'
import { Switch } from '~/components/ui/switch'
import { deepClone } from '@vue/devtools-shared'
import { Button } from '~/components/ui/button'
import { SimpleTooltip } from '~/components/ui/tooltip'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '~/components/ui/table'
import { InputField } from '~/components/ui/form'

const { useUpdateSpaceMutation } = useSpaces()
const { mutate: updateSpace } = useUpdateSpaceMutation()

const props = defineProps<{ space: SpaceResource }>()
const assetFields = ref(deepClone(props.space.settings.asset_fields ?? []))

const newFieldKey = ref('')
const newFieldLabel = ref('')
const newFieldRequired = ref(false)

const defaultFields = ['alt', 'description']

const addField = () => {
  if (newFieldKey.value && newFieldLabel.value) {
    assetFields.value.push({
      key: newFieldKey.value,
      label: newFieldLabel.value,
      required: newFieldRequired.value
    })
    newFieldKey.value = ''
    newFieldLabel.value = ''
    newFieldRequired.value = false
  }
}

const removeField = (key: string) => {
  if (!defaultFields.includes(key)) {
    assetFields.value = assetFields.value.filter(field => field.key !== key)
  }
}

const saveSettings = async () => {
  updateSpace({
    id: props.space.id,
    payload: {
      settings: {
        ...props.space.settings,
        asset_fields: assetFields.value,
      }
    }
  })
}
</script>

<template>
  <Card variant="outline">
    <CardHeader>
      <CardTitle>{{ $t('labels.settings.assetLibrary.title') }}</CardTitle>
      <CardDescription>{{ $t('labels.settings.assetLibrary.description') }}</CardDescription>
    </CardHeader>
    <CardContent class="space-y-6">

      <div class="space-y-2">
        <h4 class="text-sm font-medium">{{ $t('labels.settings.assetLibrary.metadataFields') }}</h4>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{{ $t('labels.settings.assetLibrary.key') }}</TableHead>
              <TableHead>{{ $t('labels.settings.assetLibrary.label') }}</TableHead>
              <TableHead>{{ $t('labels.settings.assetLibrary.required') }}</TableHead>
              <TableHead class="w-[50px]"/>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              v-for="field in assetFields"
              :key="field.key"
            >
              <TableCell class="font-mono">{{ field.key }}</TableCell>
              <TableCell>
                <Input v-model="field.label"/>
              </TableCell>
              <TableCell>
                <Switch
                  v-model="field.required"
                />
              </TableCell>
              <TableCell class="h-14 flex items-center justify-end">
                <SimpleTooltip :tooltip="$t('labels.settings.assetLibrary.defaultField') ">
                  <Button
                    :disabled="defaultFields.includes(field.key)"
                    variant="ghost"
                    size="icon"
                    @click="removeField(field.key)"
                  >
                    <Icon
                      name="lucide:trash"
                      class="h-4 w-4"
                    />
                    <span class="sr-only">{{ $t('actions.remove') }}</span>
                  </Button>
                </SimpleTooltip>
              </TableCell>
            </TableRow>
            <TableRow v-if="assetFields.length === 0">
              <TableCell
                colspan="4"
                class="text-center text-muted"
              >
                {{ $t('labels.settings.assetLibrary.noMetadataFields') }}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
      <div class="space-y-2">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <InputField
            v-model="newFieldKey"
            :label="$t('labels.settings.assetLibrary.fieldKey')"
            :placeholder="$t('labels.settings.assetLibrary.fieldKeyPlaceholder')"
            name="field-key"
            @keydown.enter="addField"
          />
          <InputField
            v-model="newFieldLabel"
            :label="$t('labels.settings.assetLibrary.fieldLabel')"
            :placeholder="$t('labels.settings.assetLibrary.fieldLabelPlaceholder')"
            name="field-label"
            @keydown.enter="addField"
          />
          <div class="flex items-end gap-2">
            <div class="flex items-center gap-2 pb-2.5">
              <Switch
                id="field-required"
                v-model="newFieldRequired"
                aria-label="Required field"
              />
              <Label
                :for="'field-required'"
                class="text-sm font-medium"
              >
                {{ $t('labels.settings.assetLibrary.required') }}
              </Label>
            </div>
            <Button
              variant="primary"
              :disabled="!newFieldKey || !newFieldLabel"
              class="ml-auto"
              @click="addField"
            >
              {{ $t('labels.settings.assetLibrary.addField') }}
            </Button>
          </div>
        </div>
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