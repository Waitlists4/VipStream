export interface SubtitleCue {
  start: number
  end: number
  text: string
}

function timeToSeconds(time: string): number {
  const parts = time.replace(",", ".").split(":")
  const [h, m, s] = parts.map(parseFloat)
  return h * 3600 + m * 60 + s
}

export function parseSrt(data: string): SubtitleCue[] {
  const lines = data.split("\n")
  const cues: SubtitleCue[] = []
  let i = 0

  while (i < lines.length) {
    // skip cue index
    if (/^\d+$/.test(lines[i])) i++

    // time range
    const timeMatch = lines[i]?.match(/(\d+:\d+:\d+,\d+) --> (\d+:\d+:\d+,\d+)/)
    if (timeMatch) {
      const start = timeToSeconds(timeMatch[1])
      const end = timeToSeconds(timeMatch[2])
      i++
      const textLines: string[] = []
      while (lines[i] && lines[i].trim() !== "") {
        textLines.push(lines[i])
        i++
      }
      cues.push({ start, end, text: textLines.join(" ") })
    }
    i++
  }

  return cues
}
