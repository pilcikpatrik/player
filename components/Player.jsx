"use client ";
import React, { useRef, useState, useEffect, useCallback } from "react";
import Image from "next/image";
import WaveSurfer from "wavesurfer.js";

// Hook for initializing and managing the WaveSurfer instance
const useWavesurfer = (containerRef, url) => {
  const [wavesurfer, setWavesurfer] = useState(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const ws = WaveSurfer.create({
      container: containerRef.current,
      barHeight: 1.1,
      barWidth: 3,
      cursorWidth: 0,
      autoScroll: true,
      barGap: 2,
      barRadius: 2,
      hideScrollbar: true,
      progressColor: "#000000",
      waveColor: "#EEEEEE",
      height: 30,
    });

    setWavesurfer(ws);

    return () => {
      ws.destroy();
    };
  }, [containerRef]);

  useEffect(() => {
    if (wavesurfer && url) {
      wavesurfer.load(url);

      // Listener to start playing the track once it's ready
      const handlePlayWhenReady = () => wavesurfer.play();
      wavesurfer.on("ready", handlePlayWhenReady);

      // Clean up the event listener when the component is unmounted or URL changes
      return () => {
        wavesurfer.un("ready", handlePlayWhenReady);
      };
    }
  }, [wavesurfer, url]);

  return wavesurfer;
};

// Utility function to format time in minutes:seconds
const formatTime = (timeInSeconds) => {
  const minutes = Math.floor(timeInSeconds / 60);
  const seconds = Math.floor(timeInSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const Player = ({ tracks }) => {
  const containerRef = useRef();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(0);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [currentTrack, setCurrentTrack] = useState(tracks[currentTrackIndex]);
  const [isLoading, setIsLoading] = useState(false);

  // Updated useWavesurfer hook with dependency on currentTrack
  const wavesurfer = useWavesurfer(containerRef, currentTrack.url);

  const playNextTrack = useCallback(() => {
    const nextTrackIndex = (currentTrackIndex + 1) % tracks.length;
    setCurrentTrackIndex(nextTrackIndex);
    setCurrentTrack(tracks[nextTrackIndex]);
  }, [currentTrackIndex, tracks]);

  const playPrevTrack = useCallback(() => {
    const prevTrackIndex =
      (currentTrackIndex - 1 + tracks.length) % tracks.length;
    setCurrentTrackIndex(prevTrackIndex);
    setCurrentTrack(tracks[prevTrackIndex]);
  }, [currentTrackIndex, tracks]);

  useEffect(() => {
    if (wavesurfer) {
      setIsLoading(true);

      const onReady = () => {
        setIsLoading(false);
        setTotalTime(wavesurfer.getDuration());
      };

      const onFinish = () => playNextTrack();

      wavesurfer.on("play", () => setIsPlaying(true));
      wavesurfer.on("pause", () => setIsPlaying(false));
      wavesurfer.on("audioprocess", setCurrentTime);
      wavesurfer.on("ready", onReady);
      wavesurfer.on("finish", onFinish);

      return () => {
        wavesurfer.un("play", () => setIsPlaying(true));
        wavesurfer.un("pause", () => setIsPlaying(false));
        wavesurfer.un("audioprocess", setCurrentTime);
        wavesurfer.un("ready", onReady);
        wavesurfer.un("finish", onFinish);
      };
    }
  }, [wavesurfer, playNextTrack]);

  // Zooming in and out functionality
  const onZoomInClick = useCallback(() => {
    const newZoomLevel = zoomLevel + 5;
    setZoomLevel(newZoomLevel);
    wavesurfer.zoom(newZoomLevel);
  }, [zoomLevel, wavesurfer]);

  const onZoomOutClick = useCallback(() => {
    const newZoomLevel = Math.max(0, zoomLevel - 5);
    setZoomLevel(newZoomLevel);
    wavesurfer.zoom(newZoomLevel);
  }, [zoomLevel, wavesurfer]);

  // Playing and pausing functionality
  const onPlayClick = useCallback(() => {
    wavesurfer.isPlaying() ? wavesurfer.pause() : wavesurfer.play();
  }, [wavesurfer]);

  return (
    <div className="bg-white flex flex-col rounded-lg shadow-md w-[600px]">
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <Image
            src="assets/icons/loader.svg"
            width={50}
            height={50}
            alt="loader"
            className="object-contain"
          />
        </div>
      )}
      <div className="relative p-6 flex justify-between items-center overflow-hidden w-[100%]">
        <div className="w-[100px] h-[100px] overflow-hidden rounded-md z-50">
          <Image
            src={currentTrack.imgSrc}
            alt="song"
            width={100}
            height={100}
            className=" object-cover"
          />
        </div>
        <div className="flex flex-grow justify-center gap-5 items-center z-50">
          <div className="bg-black rounded-full shadow-md flex items-center justify-center p-3">
            <Image
              src="/assets/icons/backward-step.svg"
              alt="prev"
              width={40}
              height={40}
              onClick={playPrevTrack}
            />
          </div>
          <div className="bg-black rounded-full shadow-md flex items-center justify-center p-3">
            <Image
              src={
                isPlaying ? "/assets/icons/pause.svg" : "/assets/icons/play.svg"
              }
              alt="prev"
              width={60}
              height={60}
              className=" text-black"
              onClick={onPlayClick}
            />
          </div>
          <div className="bg-black rounded-full shadow-md flex items-center justify-center p-3">
            <Image
              src="/assets/icons/forward-step.svg"
              alt="prev"
              width={40}
              height={40}
              onClick={playNextTrack}
            />
          </div>
        </div>
      </div>
      <div className="flex justify-between items-center p-6">
        <div className="w-10 flex justify-center items-center">
          <p>{formatTime(currentTime)}</p> {/* Formatting current time */}
        </div>
        <div div ref={containerRef} className="w-[80%]" />
        <div className="w-10 flex justify-center items-center">
          <p>{formatTime(totalTime)}</p> {/* Formatting total time */}
        </div>
      </div>
      <div className="flex justify-center items-center gap-5">
        <div
          className="bg-black flex justify-center items-center rounded-md p-2 cursor-pointer"
          onClick={onZoomInClick} // Attach zoom-in function here
        >
          <p className="text-white text-xs">Zoom in x5</p>
        </div>
        <div
          className="bg-black flex justify-center items-center rounded-md p-2 cursor-pointer"
          onClick={onZoomOutClick} // Attach zoom-out function here
        >
          <p className="text-white text-xs">Zoom out x5</p>
        </div>
      </div>
      <div className="flex flex-col p-6 gap-2">
        <div>
          <h1 className="text-lg font-bold">{currentTrack.title}</h1>
          <p className="text-sm mt-2">{currentTrack.description}</p>
        </div>
        <div className="flex justify-start gap-2">
          {currentTrack.tags.map((tag) => (
            <div
              key={tag}
              className="flex rounded-md bg-slate-200 justify-center items-center p-2"
            >
              <p className=" text-xs">{tag}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Player;
