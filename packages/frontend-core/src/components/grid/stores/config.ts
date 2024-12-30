import { derivedMemo } from "../../../utils"
import { derived, Readable } from "svelte/store"
import {
  SortOrder,
  UIDatasource,
  UISearchFilter,
  ViewV2Type,
} from "@budibase/types"
import { Store as StoreContext } from "."

export interface ConfigStore {
  datasource: Readable<UIDatasource>
  initialSortColumn: Readable<string | null>
  initialSortOrder: Readable<SortOrder | null>
  initialFilter: Readable<UISearchFilter | null>
  fixedRowHeight: Readable<number | null>
  schemaOverrides: Readable<Record<
    string,
    {
      displayName?: string
      disabled?: boolean
    }
  > | null>
  notifySuccess: (message: string) => void
  notifyError: (message: string) => void
}

interface PropsContext {
  props: Readable<ConfigStore>
}

export type Store = ConfigStore

export const createStores = (context: PropsContext): ConfigStore => {
  const { props } = context
  const getProp = <T extends keyof ConfigStore>(prop: T) =>
    derivedMemo(props, ($props: ConfigStore) => $props[prop])

  // Derive and memoize some props so that we can react to them in isolation
  const datasource = getProp("datasource")
  const initialSortColumn = getProp("initialSortColumn")
  const initialSortOrder = getProp("initialSortOrder")
  const initialFilter = getProp("initialFilter")
  const fixedRowHeight = getProp("fixedRowHeight")
  const schemaOverrides = getProp("schemaOverrides")
  const notifySuccess = getProp("notifySuccess")
  const notifyError = getProp("notifyError")

  return {
    datasource,
    initialSortColumn,
    initialSortOrder,
    initialFilter,
    fixedRowHeight,
    schemaOverrides,
    notifySuccess,
    notifyError,
  }
}

export const deriveStores = (context: StoreContext) => {
  const { props, definition, hasNonAutoColumn } = context

  // Derive features
  const config = derived(
    [props, definition, hasNonAutoColumn],
    ([$props, $definition, $hasNonAutoColumn]) => {
      let config = { ...$props }
      const type = $props.datasource?.type

      // Disable some features if we're editing a view
      if (type === "viewV2") {
        config.canEditColumns = false

        // Disable features for calculation views
        if ($definition?.type === ViewV2Type.CALCULATION) {
          config.canAddRows = false
          config.canEditRows = false
          config.canDeleteRows = false
          config.canExpandRows = false
        }
      }

      // Disable adding rows if we don't have any valid columns
      if (!$hasNonAutoColumn) {
        config.canAddRows = false
      }

      // Disable features for non DS+
      if (!["table", "viewV2"].includes(type)) {
        config.canAddRows = false
        config.canEditRows = false
        config.canDeleteRows = false
        config.canExpandRows = false
        config.canSaveSchema = false
        config.canEditColumns = false
      }

      return config
    }
  )

  return {
    config,
  }
}
