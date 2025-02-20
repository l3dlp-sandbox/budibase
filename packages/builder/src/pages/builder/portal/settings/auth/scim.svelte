<script>
  import {
    Button,
    Heading,
    Label,
    notifications,
    Layout,
    Body,
    Toggle,
    Input,
    Icon,
    Helpers,
  } from "@budibase/bbui"
  import { onMount } from "svelte"
  import { API } from "api"
  import { organisation, auth } from "stores/portal"

  const configType = "scim"

  $: scimEnabled = false
  $: apiKey = null

  async function saveSCIM() {
    try {
      await API.saveConfig({
        type: configType,
        config: {
          enabled: scimEnabled,
        },
      })
      notifications.success(`Settings saved`)
    } catch (e) {
      notifications.error(e.message)
      return
    }
  }

  async function fetchConfig() {
    try {
      const scimConfig = await API.getConfig(configType)
      scimEnabled = scimConfig?.config?.enabled
    } catch (error) {
      console.error(error)
      notifications.error(
        `Error fetching SCIM config - ${error?.message || "unknown error"}`
      )
    }
  }

  async function fetchAPIKey() {
    try {
      apiKey = await auth.fetchAPIKey()
    } catch (err) {
      notifications.error(
        `Unable to fetch API key - ${err?.message || "unknown error"}`
      )
    }
  }

  onMount(async () => {
    await Promise.all(fetchConfig(), fetchAPIKey())
  })

  const copyToClipboard = async value => {
    await Helpers.copyToClipboard(value)
    notifications.success("Copied")
  }

  $: settings = [
    {
      title: "Provisioning URL",
      value: `${$organisation.platformUrl}/api/global/scim/v2`,
    },
    { title: "Provisioning Token", value: apiKey },
  ]
</script>

<Layout gap="XS" noPadding>
  <div class="provider-title">
    <Heading size="S">SCIM</Heading>
  </div>
  <Body size="S">Sync users with your identity provider.</Body>
  <div class="form-row">
    <Label size="L">Activated</Label>
    <Toggle text="" bind:value={scimEnabled} />
  </div>
  {#if scimEnabled}
    {#each settings as setting}
      <div class="form-row">
        <Label size="L" tooltip={""}>{setting.title}</Label>
        <div class="inputContainer">
          <div class="input">
            <Input value={setting.value} readonly={true} />
          </div>

          <div class="copy" on:click={() => copyToClipboard(setting.value)}>
            <Icon size="S" name="Copy" />
          </div>
        </div>
      </div>
    {/each}
  {/if}
</Layout>

<div>
  <Button cta on:click={saveSCIM}>Save</Button>
</div>

<!-- TODO: DRY -->
<style>
  .form-row {
    display: grid;
    grid-template-columns: 120px 1fr;
    grid-gap: var(--spacing-l);
    align-items: center;
  }

  input[type="file"] {
    display: none;
  }
  .sso-link-icon {
    padding-top: 4px;
    margin-left: 3px;
  }
  .sso-link {
    margin-top: 12px;
    display: flex;
    flex-direction: row;
    align-items: center;
  }
  .enforce-sso-title {
    margin-right: 10px;
  }
  .enforce-sso-heading-container {
    display: flex;
    flex-direction: row;
    align-items: start;
  }
  .provider-title {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: var(--spacing-m);
  }
  .provider-title span {
    flex: 1 1 auto;
  }
  .inputContainer {
    display: flex;
    flex-direction: row;
  }
  .input {
    flex: 1;
  }
  .copy {
    display: flex;
    align-items: center;
    margin-left: 10px;
  }
</style>
