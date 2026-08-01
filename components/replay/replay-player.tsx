"use client";

import { useRef, useState } from "react";
import type { RoundResult } from "@/domain/types";
import type { ReplayMetadata } from "@/features/replay/storage";
import { createTimelineMarkers } from "@/features/replay/timeline";

export function ReplayPlayer({
  replayUrl,
  metadata,
  result,
  unavailableReason,
}: {
  replayUrl: string | null;
  metadata: ReplayMetadata | null;
  result: RoundResult;
  unavailableReason: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [rate, setRate] = useState(0.5);
  const markers = createTimelineMarkers(result);
  const seekTo = (relativeMs: number) => {
    const video = videoRef.current;
    if (!video || !metadata) return;
    const targetSeconds = Math.max(
      0,
      (metadata.ponOffsetMs + relativeMs) / 1000,
    );
    video.currentTime = Number.isFinite(video.duration)
      ? Math.min(targetSeconds, video.duration)
      : targetSeconds;
  };
  const changeRate = (nextRate: number) => {
    setRate(nextRate);
    if (videoRef.current) videoRef.current.playbackRate = nextRate;
  };

  return (
    <section className="replay-panel" aria-labelledby="replay-title">
      <h2 id="replay-title">判定リプレイとタイムライン</h2>
      {replayUrl ? (
        <>
          <video
            ref={videoRef}
            className="replay-video"
            src={replayUrl}
            controls
            playsInline
            onLoadedMetadata={() => changeRate(rate)}
          />
          <div className="replay-controls" aria-label="再生速度">
            {[0.25, 0.5, 1].map((value) => (
              <button
                key={value}
                className={rate === value ? "selected" : ""}
                onClick={() => changeRate(value)}
              >
                {value}倍
              </button>
            ))}
          </div>
        </>
      ) : (
        <p className="replay-fallback">
          {unavailableReason ??
            "このラウンドではリプレイを利用できません。判定タイムラインは確認できます。"}
        </p>
      )}
      <div className="result-timeline" aria-label="判定イベントのタイムライン">
        <div className="result-timeline-track">
          {markers.map((marker) => (
            <button
              key={marker.id}
              className={`timeline-marker ${marker.kind}`}
              style={{ left: `${marker.positionPercent}%` }}
              onClick={() => seekTo(marker.relativeMs)}
              disabled={!replayUrl || !metadata}
              aria-label={`${marker.label} ${marker.relativeMs >= 0 ? "+" : ""}${marker.relativeMs}ミリ秒へ移動`}
            >
              <i />
              <span>{marker.label}</span>
              <small>
                {marker.relativeMs >= 0 ? "+" : ""}
                {marker.relativeMs}ms
              </small>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
