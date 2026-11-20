import {
  afterNextRender,
  Component,
  computed,
  ElementRef,
  Injector,
  signal,
  viewChild,
} from '@angular/core';

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: Record<string, unknown>,
      ) => YouTubePlayer;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

interface YouTubePlayer {
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  pauseVideo(): void;
  destroy(): void;
}

@Component({
  selector: 'app-root',
  imports: [],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  readonly brand = "Paul Welby's Housing Stability Fund";
  readonly goFundMeUrl =
    'https://www.gofundme.com/f/paul-welbys-housing-stability-fund';
  readonly youtubeId = 'x9sB4MtjI6o';
  /** Meaningful audio/video ends here; restart instead of lingering past it. */
  readonly youtubeEndSeconds = 90;
  readonly raised = 200;
  readonly goal = 5000;
  readonly donorCount = 2;
  readonly deadline = 'November 30, 2026';
  readonly location = 'Fallbrook, CA';
  readonly category = 'Rent, Food & Monthly Bills';
  readonly started = 'November 8, 2026';
  readonly progress = computed(() => Math.min(100, Math.round((this.raised / this.goal) * 100)));

  readonly menuOpen = signal(false);
  private readonly youtubeHost = viewChild<ElementRef<HTMLDivElement>>('youtubeHost');
  private player: YouTubePlayer | null = null;

  readonly updates = [
    {
      date: this.started,
      title: 'Campaign launched',
      body: 'The Housing Stability Fund opened to help cover urgent rent arrears before the eviction deadline.',
    },
    {
      date: 'November 2026',
      title: `$${this.raised.toLocaleString()} raised from ${this.donorCount} donations`,
      body: 'Early supporters have helped start the climb toward the goal. Shares still make a real difference.',
    },
    {
      date: this.deadline,
      title: 'Eviction deadline',
      body: 'Funds help catch up on rent so Paul can stay housed and move toward a more stable next chapter near family.',
    },
  ];

  constructor(private readonly injector: Injector) {
    afterNextRender(() => this.setupYouTubePlayer(), { injector: this.injector });
  }

  toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  closeMenu(): void {
    this.menuOpen.set(false);
  }

  private setupYouTubePlayer(): void {
    const host = this.youtubeHost()?.nativeElement;
    if (!host) {
      return;
    }

    const create = () => this.createPlayer(host);

    if (window.YT?.Player) {
      create();
      return;
    }

    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      previous?.();
      create();
    };

    if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      document.body.appendChild(script);
    }
  }

  private createPlayer(host: HTMLDivElement): void {
    if (!window.YT?.Player || this.player) {
      return;
    }

    this.player = new window.YT.Player(host, {
      videoId: this.youtubeId,
      width: '100%',
      height: '100%',
      playerVars: {
        rel: 0,
        modestbranding: 1,
        playsinline: 1,
        iv_load_policy: 3,
        start: 0,
        end: this.youtubeEndSeconds,
      },
      events: {
        onStateChange: (event: { data: number; target: YouTubePlayer }) => {
          if (event.data === window.YT?.PlayerState.ENDED) {
            event.target.seekTo(0, true);
            event.target.pauseVideo();
          }
        },
      },
    });
  }
}
