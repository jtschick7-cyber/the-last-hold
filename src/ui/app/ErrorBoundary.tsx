import { Component, type ComponentChildren } from 'preact';
import { copyDiagnostics } from '../more/DiagnosticsSheet';
import styles from '../styles/ui.module.css';
import { currentScreen, diagnostics } from './runtime';

// Technical design §15.1: a crash shows a calm fallback with "Copy diagnostics"
// and "Reload". The save isn't touched.
interface State {
  failed: boolean;
  note: string | null;
}

export class ErrorBoundary extends Component<{ children: ComponentChildren }, State> {
  override state: State = { failed: false, note: null };

  override componentDidCatch(error: unknown): void {
    diagnostics()?.push({
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? (error.stack ?? '') : '',
      time: Date.now(),
      screen: currentScreen.value,
    });
    this.setState({ failed: true });
  }

  override render() {
    if (!this.state.failed) return this.props.children;
    return (
      <main
        style={{ maxWidth: '36rem', margin: '0 auto', padding: 'var(--space-4) var(--space-3)' }}
      >
        <h1>Something went wrong.</h1>
        <p>Your save is safe; nothing was changed. Copying the diagnostics helps get this fixed.</p>
        <div class={styles.row}>
          <button
            type="button"
            class={styles.btnPrimary}
            onClick={async () => this.setState({ note: await copyDiagnostics() })}
          >
            Copy diagnostics
          </button>
          <button type="button" class={styles.btn} onClick={() => window.location.reload()}>
            Reload
          </button>
        </div>
        {this.state.note && <p class={styles.small}>{this.state.note}</p>}
      </main>
    );
  }
}
