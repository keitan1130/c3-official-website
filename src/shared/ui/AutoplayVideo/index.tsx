import { useCallback, useRef, useState } from "react";

import styles from "./index.module.css";

interface AutoplayVideoProps {
  src: string;
  poster: string;
  "aria-label"?: string;
}

const playMutedVideo = (video: HTMLVideoElement) => {
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  return video.play();
};

const initializeVideo = (video: HTMLVideoElement | null) => {
  if (!video) return;
  // React's muted prop sets the property; defaultMuted also reflects the attribute.
  video.defaultMuted = true;
  video.muted = true;
  video.playsInline = true;
  if (video.readyState >= HTMLMediaElement.HAVE_FUTURE_DATA) {
    void playMutedVideo(video).catch(() => {});
  }
};

const AutoplayVideo = ({ src, poster, ...props }: AutoplayVideoProps) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasPlaybackError, setHasPlaybackError] = useState(false);
  const label = props["aria-label"] ?? "動画";
  const initializeVideoRef = useCallback((video: HTMLVideoElement | null) => {
    videoRef.current = video;
    initializeVideo(video);
  }, []);

  const handlePlayClick = () => {
    const video = videoRef.current;
    if (!video) return;
    setHasPlaybackError(false);
    // Call play synchronously within the user's click, as required by iOS.
    void playMutedVideo(video).catch(() => setHasPlaybackError(true));
  };

  return (
    <span className={styles["player"]}>
      <video
        {...props}
        ref={initializeVideoRef}
        poster={poster}
        preload="metadata"
        playsInline
        muted
        autoPlay
        loop
        onCanPlay={(event) => {
          const video = event.currentTarget;
          if (video.paused) void playMutedVideo(video).catch(() => {});
        }}
        onPlaying={() => {
          setIsPlaying(true);
          setHasPlaybackError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onEnded={() => setIsPlaying(false)}
        onError={() => {
          setIsPlaying(false);
          setHasPlaybackError(true);
        }}
      >
        <source src={src} type="video/mp4" />
      </video>
      {!isPlaying && (
        <button
          type="button"
          className={styles["play-button"]}
          aria-label={`${label}を再生`}
          onClick={handlePlayClick}
        >
          <img src={poster} alt="" />
        </button>
      )}
      {hasPlaybackError && (
        <span className={styles["error"]} role="alert">
          動画を再生できませんでした。もう一度お試しください。
        </span>
      )}
    </span>
  );
};

export default AutoplayVideo;
