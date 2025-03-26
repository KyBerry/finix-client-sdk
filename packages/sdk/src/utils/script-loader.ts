/**
 * Handles secure script loading with CSP support
 * @param nonce - CSP nonce value
 * @param callback - Callback function to execute after script loads
 */
export class ScriptLoader {
  private loadedScripts: Set<string> = new Set();
  private loadingScripts: Map<string, Promise<void>> = new Map();
  private nonce?: string;

  constructor(nonce?: string) {
    this.nonce = nonce;
  }

  /**
   * Checks if a script has already been loaded
   * @param url - The URL of the script to check
   * @returns true if the script has been loaded, false otherwise
   */
  public isScriptLoaded(url: string) {
    return this.loadedScripts.has(url);
  }

  /**
   * Loads a script from the given URL
   * @param url - The URL of the script to load
   * @param callback - Optional callback function to execute after script loads
   */
  public async loadScript(url: string, callback?: () => void): Promise<void> {
    // If script is already loaded, return resolved promise
    if (this.isScriptLoaded(url)) {
      return Promise.resolve();
    }

    // Create promise for script load
    const loadPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement("script");

      script.src = url;

      if (this.nonce) {
        script.setAttribute("nonce", this.nonce);
      }

      script.onload = () => {
        this.loadedScripts.add(url);
        this.loadingScripts.delete(url);
        callback?.();
        resolve();
      };

      script.onerror = (event) => {
        console.error(`Failed to load script from ${url}`, event);
        this.loadingScripts.delete(url);
        reject(event);
      };

      document.head.appendChild(script);
    });

    // Store the loading promise
    this.loadingScripts.set(url, loadPromise);

    return loadPromise;
  }

  /**
   * Removes a script from the document
   * @param url - The URL of the script to remove
   */
  public removeScript(url: string) {
    const script = document.querySelector(`script[src="${url}"]`);
    if (script) {
      script.parentElement?.removeChild(script);
    }

    this.loadedScripts.delete(url);
  }
}
