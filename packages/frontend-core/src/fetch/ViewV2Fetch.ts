import { SortOrder, UIView, ViewV2, ViewV2Type } from "@budibase/types"
import DataFetch from "./DataFetch"
import { get } from "svelte/store"
import { helpers } from "@budibase/shared-core"

export default class ViewV2Fetch extends DataFetch<UIView, ViewV2> {
  determineFeatureFlags() {
    return {
      supportsSearch: true,
      supportsSort: true,
      supportsPagination: true,
    }
  }

  getSchema(_datasource: UIView, definition: ViewV2) {
    return definition?.schema
  }

  async getDefinition(datasource: UIView | null): Promise<ViewV2 | null> {
    if (!datasource?.id) {
      return null
    }
    try {
      const res = await this.API.viewV2.fetchDefinition(datasource.id)
      return res?.data
    } catch (error: any) {
      this.store.update(state => ({
        ...state,
        error,
      }))
      return null
    }
  }

  getDefaultSortColumn(
    _definition: { primaryDisplay?: string } | null,
    _schema: Record<string, any>
  ) {
    return null
  }

  async getData() {
    const { datasource, limit, sortColumn, sortOrder, sortType, paginate } =
      this.options
    const { cursor, query, definition } = get(this.store)

    // If this is a calculation view and we have no calculations, return nothing
    if (
      definition?.type === ViewV2Type.CALCULATION &&
      !Object.values(definition.schema || {}).some(
        helpers.views.isCalculationField
      )
    ) {
      return {
        rows: [],
        hasNextPage: false,
        cursor: null,
        error: null,
      }
    }

    // If sort/filter params are not defined, update options to store the
    // params built in to this view. This ensures that we can accurately
    // compare old and new params and skip a redundant API call.
    if (!sortColumn && definition?.sort?.field) {
      this.options.sortColumn = definition.sort.field
      this.options.sortOrder = definition.sort.order || SortOrder.ASCENDING
    }

    try {
      const request = {
        ...(query ? { query } : {}),
        paginate,
        limit,
        bookmark: cursor,
        sort: sortColumn,
        sortOrder: sortOrder,
        sortType,
      }
      if (paginate) {
        const res = await this.API.viewV2.fetch(datasource.id, {
          ...request,
          paginate,
        })
        return {
          rows: res?.rows || [],
          hasNextPage: res?.hasNextPage || false,
          cursor: res?.bookmark || null,
        }
      } else {
        const res = await this.API.viewV2.fetch(datasource.id, {
          ...request,
          paginate,
        })
        return {
          rows: res?.rows || [],
          hasNextPage: false,
          cursor: null,
        }
      }
    } catch (error) {
      return {
        rows: [],
        hasNextPage: false,
        cursor: null,
        error,
      }
    }
  }
}
