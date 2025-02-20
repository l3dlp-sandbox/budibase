<script>
  import { getContext, onMount } from "svelte"
  import GridScrollWrapper from "./GridScrollWrapper.svelte"
  import GridRow from "./GridRow.svelte"
  import { BlankRowID } from "../lib/constants"

  const {
    bounds,
    renderedRows,
    renderedColumns,
    rowVerticalInversionIndex,
    config,
    hoveredRowId,
    dispatch,
  } = getContext("grid")

  let body

  $: renderColumnsWidth = $renderedColumns.reduce(
    (total, col) => (total += col.width),
    0
  )

  onMount(() => {
    // Observe and record the height of the body
    const observer = new ResizeObserver(() => {
      bounds.set(body.getBoundingClientRect())
    })
    observer.observe(body)
    return () => {
      observer.disconnect()
    }
  })
</script>

<div bind:this={body} class="grid-body">
  <GridScrollWrapper scrollHorizontally scrollVertically wheelInteractive>
    {#each $renderedRows as row, idx}
      <GridRow {row} {idx} invertY={idx >= $rowVerticalInversionIndex} />
    {/each}
    {#if $config.allowAddRows && $renderedColumns.length}
      <div
        class="blank"
        class:highlighted={$hoveredRowId === BlankRowID}
        style="width:{renderColumnsWidth}px"
        on:mouseenter={() => ($hoveredRowId = BlankRowID)}
        on:mouseleave={() => ($hoveredRowId = null)}
        on:click={() => dispatch("add-row-inline")}
      />
    {/if}
  </GridScrollWrapper>
</div>

<style>
  .grid-body {
    display: block;
    position: relative;
    cursor: default;
    overflow: hidden;
    flex: 1 1 auto;
  }
  .blank {
    height: var(--row-height);
    background: var(--cell-background);
    border-bottom: var(--cell-border);
    border-right: var(--cell-border);
    position: absolute;
  }
  .blank.highlighted {
    background: var(--cell-background-hover);
    cursor: pointer;
  }
</style>
