/**
 * A small generative lo-fi beat made entirely with the Web Audio API, so the project
 * ships no audio files and has no licensing to worry about. Drums, bass, warm chords
 * and a sparse pentatonic melody loop forever at a relaxed tempo.
 */
const BPM = 86;
const STEP = 60 / BPM / 4; // one 16th note, in seconds
const SWING = 0.28; // fraction of a step that off-beat 16ths are delayed

const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12);

// Am9 - Fmaj7 - Cmaj7 - G6: [bass root, chord tones]
const CHORDS: [number, number[]][] = [
	[45, [57, 60, 64, 67, 71]],
	[41, [53, 57, 60, 64, 67]],
	[48, [60, 64, 67, 71, 74]],
	[43, [59, 62, 66, 69, 71]]
];
const PENTATONIC = [69, 72, 74, 76, 79, 81]; // A minor pentatonic, upper register

export class Beat {
	private ctx: AudioContext | null = null;
	private master!: GainNode;
	private noise!: AudioBuffer;
	private timer = 0;
	private step = 0;
	private next = 0;
	playing = false;

	private build() {
		const ctx = new AudioContext();
		this.ctx = ctx;
		this.master = ctx.createGain();
		this.master.gain.value = 0.0001;

		// Everything runs through a gentle low-pass for the tape-warm lo-fi sound.
		const tone = ctx.createBiquadFilter();
		tone.type = 'lowpass';
		tone.frequency.value = 3800;
		this.master.connect(tone).connect(ctx.destination);

		// Echo for space on the melody and chords.
		const delay = ctx.createDelay(1);
		delay.delayTime.value = STEP * 3;
		const fb = ctx.createGain();
		fb.gain.value = 0.34;
		const wet = ctx.createGain();
		wet.gain.value = 0.35;
		delay.connect(fb).connect(delay);
		delay.connect(wet).connect(this.master);
		this.echo = delay;

		this.noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
		const d = this.noise.getChannelData(0);
		for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
	}
	private echo!: DelayNode;

	private tone(freq: number, t: number, dur: number, vol: number, type: OscillatorType, sendEcho = false, attack = 0.01) {
		const ctx = this.ctx!;
		const o = ctx.createOscillator();
		const g = ctx.createGain();
		o.type = type;
		o.frequency.value = freq;
		g.gain.setValueAtTime(0.0001, t);
		g.gain.linearRampToValueAtTime(vol, t + attack);
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		o.connect(g).connect(this.master);
		if (sendEcho) g.connect(this.echo);
		o.start(t);
		o.stop(t + dur + 0.05);
	}

	private hit(t: number, dur: number, vol: number, freq: number, type: BiquadFilterType) {
		const ctx = this.ctx!;
		const src = ctx.createBufferSource();
		src.buffer = this.noise;
		const f = ctx.createBiquadFilter();
		f.type = type;
		f.frequency.value = freq;
		const g = ctx.createGain();
		g.gain.setValueAtTime(vol, t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
		src.connect(f).connect(g).connect(this.master);
		src.start(t);
		src.stop(t + dur + 0.05);
	}

	private kick(t: number) {
		const ctx = this.ctx!;
		const o = ctx.createOscillator();
		const g = ctx.createGain();
		o.frequency.setValueAtTime(130, t);
		o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
		g.gain.setValueAtTime(0.9, t);
		g.gain.exponentialRampToValueAtTime(0.0001, t + 0.32);
		o.connect(g).connect(this.master);
		o.start(t);
		o.stop(t + 0.35);
	}

	private schedule(step: number, t: number) {
		const bar = Math.floor(step / 16);
		const s = step % 16;
		const [root, chord] = CHORDS[Math.floor(bar / 2) % CHORDS.length];

		if (s === 0 || s === 10 || (s === 7 && bar % 4 === 3)) this.kick(t);
		if (s === 4 || s === 12) this.hit(t, 0.16, 0.5, 1800, 'bandpass');
		if (s % 2 === 0) this.hit(t, 0.04, s % 4 === 2 ? 0.16 : 0.1, 7000, 'highpass');

		// Bass: root on the downbeat and a pickup.
		if (s === 0) this.tone(midi(root - 12), t, STEP * 5, 0.5, 'triangle');
		if (s === 6 || s === 14) this.tone(midi(root - 12 + (s === 14 ? 7 : 0)), t, STEP * 2.5, 0.34, 'triangle');

		// Chords: soft stabs.
		if (s === 0 || s === 8) {
			for (const n of chord) this.tone(midi(n), t, STEP * 7, 0.07, 'sine', true, 0.04);
		}

		// Sparse melody, different each pass.
		if ((s === 3 || s === 11 || s === 14) && Math.random() < 0.55) {
			const n = PENTATONIC[Math.floor(Math.random() * PENTATONIC.length)];
			this.tone(midi(n), t, STEP * 3, 0.1, 'triangle', true, 0.005);
		}
	}

	private tick = () => {
		const ctx = this.ctx!;
		while (this.next < ctx.currentTime + 0.12) {
			const swing = this.step % 2 === 1 ? STEP * SWING : 0;
			this.schedule(this.step, this.next + swing);
			this.next += STEP;
			this.step++;
		}
	};

	async start() {
		if (this.playing) return;
		if (!this.ctx) this.build();
		const ctx = this.ctx!;
		await ctx.resume();
		this.next = ctx.currentTime + 0.05;
		this.master.gain.cancelScheduledValues(ctx.currentTime);
		this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
		this.master.gain.linearRampToValueAtTime(0.5, ctx.currentTime + 1.5);
		this.timer = window.setInterval(this.tick, 25);
		this.playing = true;
	}

	stop() {
		if (!this.playing || !this.ctx) return;
		const ctx = this.ctx;
		this.master.gain.cancelScheduledValues(ctx.currentTime);
		this.master.gain.setValueAtTime(this.master.gain.value, ctx.currentTime);
		this.master.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
		window.clearInterval(this.timer);
		this.playing = false;
		setTimeout(() => {
			if (!this.playing) void ctx.suspend();
		}, 800);
	}
}
