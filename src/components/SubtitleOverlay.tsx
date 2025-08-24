"use client"

import React, { useEffect, useRef, useState } from "react"
import SubtitleSelector from "./SubtitleSelector"
import { parseSrt, SubtitleCue } from "../utils/subtitleParser"
import { getVidnestStreamUrl } from "../services/vidnest"

interface SubtitleOverlayProps {
  tmdbId: number
  embedUrl: string // the same one you pass to the iframe
}

const SubtitleOverlay: React.FC<SubtitleOverlayProps> = ({ tmdbId, embedUrl }) => {
  const [cues, setCues] = useState<SubtitleCue[]>([])
  const [currentText, setCurrentText] = useState("")
  const [streamUrl, setStreamUrl] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)

  // Autofetch the real stream url
  useEffect(() => {
    const fetchStream = async () => {
      const url = await getVidnestStreamUrl(embedUrl)
      setStreamUrl(url)
    }
    fetchStream()
  }, [embedUrl])

  // Poll playback time for subtitle sync
  useEffect(() => {
    if (!streamUrl) return
    const interval = setInterval(() => {
      if (!videoRef.current) return
      const time = videoRef.current.currentTime
      const cue = cues.find((c) => time >= c.start && time <= c.end)
      setCurrentText(cue ? cue.text : "")
    }, 500)
    return () => clearInterval(interval)
  }, [cues, streamUrl])

  const handleSelectSubtitle = async (url: string | null) => {
    if (!url) {
      setCues([])
      setCurrentText("")
      return
    }
    const text = await fetch(url).then((res) => res.text())
    const parsed = parseSrt(text)
    setCues(parsed)
  }

  return (
    <>
      {/* hidden video just for timing */}
      {streamUrl && (
        <video
          ref={videoRef}
          src={streamUrl}
          muted
          playsInline
          autoPlay
          style={{ display: "none" }}
        />
      )}

      {/* subtitle selector (hover) */}
      <div className="absolute top-6 right-6 group z-20">
        <div className="transition-opacity duration-300 opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto">
          <SubtitleSelector tmdbId={tmdbId} onSelect={handleSelectSubtitle} />
        </div>
      </div>

      {/* overlay text */}
      {currentText && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-20 text-center w-full px-4">
          <span className="bg-black/70 text-white text-lg font-semibold inline-block px-4 py-2 rounded-lg max-w-3xl">
            {currentText}
          </span>
        </div>
      )}
    </>
  )
}

export default SubtitleOverlay
