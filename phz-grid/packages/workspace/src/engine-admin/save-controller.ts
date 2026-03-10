import type { ReactiveControllerHost, ReactiveController } from 'lit';

export type SaveState = 'idle' | 'saving' | 'saved' | 'error';

export class SaveController implements ReactiveController {
  private host: ReactiveControllerHost;
  private lastSaveFn?: () => Promise<void>;
  private autoDismissTimer?: ReturnType<typeof setTimeout>;
  private saveGeneration = 0;

  state: SaveState = 'idle';
  dirty = false;
  errorMessage = '';

  constructor(host: ReactiveControllerHost) {
    this.host = host;
    this.host.addController(this);
  }

  hostConnected(): void {}
  hostDisconnected(): void {
    if (this.autoDismissTimer) clearTimeout(this.autoDismissTimer);
  }

  markDirty(): void {
    this.dirty = true;
    this.host.requestUpdate();
  }

  markClean(): void {
    this.dirty = false;
    this.host.requestUpdate();
  }

  async save(fn: () => Promise<void>): Promise<void> {
    this.lastSaveFn = fn;
    const gen = ++this.saveGeneration;
    this.state = 'saving';
    this.errorMessage = '';
    this.host.requestUpdate();

    try {
      await fn();
      if (gen !== this.saveGeneration) return;
      this.state = 'saved';
      this.dirty = false;
      this.host.requestUpdate();
      this.scheduleAutoDismiss();
    } catch (err) {
      if (gen !== this.saveGeneration) return;
      this.state = 'error';
      this.errorMessage = err instanceof Error ? err.message : String(err);
      this.host.requestUpdate();
    }
  }

  async retry(): Promise<void> {
    if (this.state !== 'error' || !this.lastSaveFn) return;
    await this.save(this.lastSaveFn);
  }

  dismiss(): void {
    this.state = 'idle';
    this.errorMessage = '';
    this.host.requestUpdate();
  }

  get beforeUnloadMessage(): string {
    return this.dirty ? 'You have unsaved changes. Are you sure you want to leave?' : '';
  }

  private scheduleAutoDismiss(): void {
    if (this.autoDismissTimer) clearTimeout(this.autoDismissTimer);
    this.autoDismissTimer = setTimeout(() => {
      if (this.state === 'saved') {
        this.state = 'idle';
        this.host.requestUpdate();
      }
    }, 3000);
  }
}
