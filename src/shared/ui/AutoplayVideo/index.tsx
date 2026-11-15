interface AutoplayVideoProps {
  src: string;
  poster: string;
  "aria-label"?: string;
}

const playMutedVideo = (video: HTMLVideoElement) => {
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  if (video.paused) {
    // Autoplay can still be denied by the browser, for example in Low Power Mode.
    void video.play().catch(() => {});
  }
};

const initializeVideo = (video: HTMLVideoElement | null) => {
  if (!video) return;
  // React's muted prop sets the property; defaultMuted also reflects the attribute.
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    playMutedVideo(video);
  }
};

const AutoplayVideo = ({ src, poster, ...props }: AutoplayVideoProps) => (
  <video
    {...props}
    ref={initializeVideo}
    poster={poster}
    preload="metadata"
    playsInline
    muted
    autoPlay
    loop
    onCanPlay={(event) => playMutedVideo(event.currentTarget)}
  >
    <source src={src} type="video/mp4" />
  </video>
);

export default AutoplayVideo;
