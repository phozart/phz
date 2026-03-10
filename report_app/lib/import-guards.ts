/**
 * Guarded dynamic imports for Lit web component packages.
 *
 * Lit's @customElement decorator calls customElements.define() on import.
 * During webpack HMR, re-importing the same module throws:
 *   NotSupportedError: the name "phz-xxx" has already been used
 *
 * Fix: cache the import promise at module scope so each package is only
 * imported once, regardless of how many React re-renders or HMR cycles occur.
 */

let workspacePromise: Promise<any> | null = null;
let viewerPromise: Promise<any> | null = null;
let editorPromise: Promise<any> | null = null;
let gridPromise: Promise<any> | null = null;
let authoringPromise: Promise<any> | null = null;

export function importWorkspaceAll(): Promise<any> {
  if (!workspacePromise) {
    workspacePromise = import('@phozart/phz-workspace/all');
  }
  return workspacePromise;
}

export function importViewer(): Promise<any> {
  if (!viewerPromise) {
    viewerPromise = import('@phozart/phz-viewer');
  }
  return viewerPromise;
}

export function importEditor(): Promise<any> {
  if (!editorPromise) {
    editorPromise = import('@phozart/phz-editor');
  }
  return editorPromise;
}

export function importGrid(): Promise<any> {
  if (!gridPromise) {
    gridPromise = import('@phozart/phz-grid');
  }
  return gridPromise;
}

export function importAuthoring(): Promise<any> {
  if (!authoringPromise) {
    authoringPromise = import('@phozart/phz-workspace/authoring');
  }
  return authoringPromise;
}
