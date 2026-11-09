<script lang="ts">
  /** Title of the current book; turns the wordmark into a breadcrumb. */
  let { current }: { current?: string } = $props()
</script>

<header>
  <div class="crumb">
    <a class="brand" class:parent={current} href="#/">HD Bookshelf</a>
    {#if current}
      <span class="sep" aria-hidden="true">/</span>
      <span class="current" aria-current="page">{current}</span>
    {/if}
  </div>
  <a class="github" href="https://github.com/Hongda-OSU/hd-bookshelf">
    <!-- GitHub mark from Octicons (MIT) -->
    <svg aria-hidden="true" viewBox="0 0 16 16">
      <path
        d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z"
      ></path>
    </svg>
    <span class="visually-hidden">GitHub</span>
  </a>
</header>

<style>
  header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 18px 0;
    border-bottom: 1px solid var(--line);
  }
  /* Baseline, not center: the caps sans and the serif title have different
     line boxes, so centring them leaves the title visibly higher. */
  .crumb {
    display: flex;
    align-items: baseline;
    gap: 12px;
    min-width: 0;
  }
  .brand {
    flex: none;
    padding: 14px 0;
    /* Wordmark: written "HD Bookshelf" in markup so screen readers
       say it naturally; shown in caps. */
    font: 600 14px/1 var(--sans);
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .brand.parent {
    color: var(--muted);
  }
  .brand.parent:hover {
    color: var(--text);
  }
  .sep {
    color: rgba(236, 232, 225, 0.25);
  }
  /* Long titles truncate instead of pushing the GitHub link off. */
  .current {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font: 500 15px/1.2 var(--serif);
  }

  /* Icon-only link; padding keeps a 44px touch target. */
  .github {
    flex: none;
    display: inline-flex;
    padding: 12px;
    margin-right: -12px;
    color: var(--muted);
    border-radius: 6px;
  }
  .github:hover {
    color: var(--text);
  }
  .github svg {
    width: 20px;
    height: 20px;
    fill: currentColor;
  }
</style>
