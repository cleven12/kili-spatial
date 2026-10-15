import { Beat } from '#lib/audio/beat.ts';

/** Presentation settings that are not about the data: panels, label size and sound. */
class UiState {
	/** Canvas-only mode: every panel and tool is hidden. */
	toolsHidden = $state(false);
	/** Larger text everywhere, for projectors and conference screens. */
	bigText = $state(false);
	gpsOpen = $state(false);
	fundOpen = $state(false);
	music = $state(false);
	private beat: Beat | null = null;

	toggleTools() {
		this.toolsHidden = !this.toolsHidden;
	}

	toggleBigText() {
		this.bigText = !this.bigText;
		document.documentElement.classList.toggle('big', this.bigText);
	}

	async toggleMusic() {
		this.beat ??= new Beat();
		if (this.music) {
			this.beat.stop();
			this.music = false;
		} else {
			await this.beat.start();
			this.music = true;
		}
	}
}

export const ui = new UiState();
