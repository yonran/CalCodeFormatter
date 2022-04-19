
// Default to True, if the UI hasn't been brought up yet, which sets initial state for 'active'.
// This could be done in a background script on the onInstall listener, but this is easier.
chrome.storage.local.get({ active: true }, ({ active }) => {
  if (active) {
    (async () => {
      const { reformatPage } = await import('./reformat_util.js');
      reformatPage();
    })()
  }
});
