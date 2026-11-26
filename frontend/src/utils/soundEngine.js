// Procedural ambient sound generator (Web Audio API).
// Prototype audio: everything is synthesised live, so no third-party recordings or licences are involved.

function noiseBuffer(ctx, kind) {
  const len = ctx.sampleRate * 4
  const buf = ctx.createBuffer(2, len, ctx.sampleRate)
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch)
    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1
      if (kind === 'white') d[i] = w * 0.5
      else if (kind === 'brown') {
        last = (last + 0.02 * w) / 1.02
        d[i] = last * 3.2
      } else {
        // pink (Paul Kellet)
        b0 = 0.99886 * b0 + w * 0.0555179
        b1 = 0.99332 * b1 + w * 0.0750759
        b2 = 0.969 * b2 + w * 0.153852
        b3 = 0.8665 * b3 + w * 0.3104856
        b4 = 0.55 * b4 + w * 0.5329522
        b5 = -0.7616 * b5 - w * 0.016898
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11
        b6 = w * 0.115926
      }
    }
  }
  return buf
}

class SoundEngine {
  ctx = null
  master = null
  nodes = []
  timers = []
  volume = 0.6

  ensure() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext
      if (!AC) throw new Error('Audio is not supported in this browser')
      this.ctx = new AC()
      this.master = this.ctx.createGain()
      this.master.gain.value = 0
      this.master.connect(this.ctx.destination)
      this.buffers = {}
    }
    if (this.ctx.state === 'suspended') this.ctx.resume()
    return this.ctx
  }

  buffer(kind) {
    if (!this.buffers[kind]) this.buffers[kind] = noiseBuffer(this.ctx, kind)
    return this.buffers[kind]
  }

  src(kind) {
    const s = this.ctx.createBufferSource()
    s.buffer = this.buffer(kind)
    s.loop = true
    s.start()
    this.nodes.push(s)
    return s
  }

  filter(type, freq, q = 0.7) {
    const f = this.ctx.createBiquadFilter()
    f.type = type
    f.frequency.value = freq
    f.Q.value = q
    return f
  }

  lfo(target, rate, depth, base) {
    const o = this.ctx.createOscillator()
    const g = this.ctx.createGain()
    o.frequency.value = rate
    g.gain.value = depth
    target.value = base
    o.connect(g).connect(target)
    o.start()
    this.nodes.push(o)
  }

  chain(...ns) {
    ns.reduce((a, b) => a.connect(b))
    return ns[ns.length - 1]
  }

  play(sound) {
    this.stopNodes()
    const ctx = this.ensure()
    const out = ctx.createGain()
    out.connect(this.master)
    this.nodes.push(out)

    if (sound === 'white') this.chain(this.src('white'), this.filter('lowpass', 9000), out)
    else if (sound === 'brown') this.chain(this.src('brown'), this.filter('lowpass', 700), out)
    else if (sound === 'rain') {
      const g = ctx.createGain()
      this.chain(this.src('pink'), this.filter('highpass', 500), this.filter('lowpass', 7000), g, out)
      this.lfo(g.gain, 0.15, 0.12, 0.85)
    } else if (sound === 'ocean') {
      const g = ctx.createGain()
      this.chain(this.src('brown'), this.filter('lowpass', 900), g, out)
      this.lfo(g.gain, 0.09, 0.55, 0.6)
      const g2 = ctx.createGain()
      this.chain(this.src('pink'), this.filter('highpass', 1800), g2, out)
      this.lfo(g2.gain, 0.09, 0.08, 0.08)
    } else if (sound === 'stream') {
      const f = this.filter('bandpass', 1400, 0.6)
      this.chain(this.src('white'), f, out)
      this.lfo(f.frequency, 0.7, 300, 1400)
    } else if (sound === 'forest') {
      const g = ctx.createGain()
      this.chain(this.src('pink'), this.filter('lowpass', 1200), g, out)
      this.lfo(g.gain, 0.05, 0.25, 0.45)
      const chirp = () => {
        if (!this.ctx) return
        const t = ctx.currentTime
        const o = ctx.createOscillator()
        const eg = ctx.createGain()
        const base = 2200 + Math.random() * 1800
        o.frequency.setValueAtTime(base, t)
        o.frequency.exponentialRampToValueAtTime(base * 1.4, t + 0.08)
        o.frequency.exponentialRampToValueAtTime(base * 0.9, t + 0.16)
        eg.gain.setValueAtTime(0, t)
        eg.gain.linearRampToValueAtTime(0.05, t + 0.02)
        eg.gain.exponentialRampToValueAtTime(0.0001, t + 0.2)
        o.connect(eg).connect(out)
        o.start(t)
        o.stop(t + 0.22)
        this.timers.push(setTimeout(chirp, 1500 + Math.random() * 4500))
      }
      this.timers.push(setTimeout(chirp, 800))
    } else {
      // drone: soft pad for stories / relaxation
      const lp = this.filter('lowpass', 600)
      lp.connect(out)
      ;[110, 164.81, 220].forEach((f, i) => {
        const o = ctx.createOscillator()
        const g = ctx.createGain()
        o.type = 'sine'
        o.frequency.value = f
        g.gain.value = 0.12 / (i + 1)
        o.connect(g).connect(lp)
        o.start()
        this.nodes.push(o)
      })
      const g = ctx.createGain()
      this.chain(this.src('brown'), this.filter('lowpass', 400), g, out)
      g.gain.value = 0.25
    }
    this.fadeTo(this.volume, 1.5)
  }

  fadeTo(v, secs = 0.4) {
    if (!this.ctx) return
    const t = this.ctx.currentTime
    this.master.gain.cancelScheduledValues(t)
    this.master.gain.setValueAtTime(this.master.gain.value, t)
    this.master.gain.linearRampToValueAtTime(v, t + secs)
  }

  setVolume(v) {
    this.volume = v
    this.fadeTo(v, 0.15)
  }

  stopNodes() {
    this.timers.forEach(clearTimeout)
    this.timers = []
    this.nodes.forEach((n) => {
      try {
        n.stop?.()
      } catch {
        /* already stopped */
      }
      n.disconnect?.()
    })
    this.nodes = []
  }

  stop(fade = 0.8) {
    if (!this.ctx) return
    this.fadeTo(0, fade)
    const nodes = this.nodes
    const timers = this.timers
    this.nodes = []
    this.timers = []
    setTimeout(() => {
      timers.forEach(clearTimeout)
      nodes.forEach((n) => {
        try {
          n.stop?.()
        } catch {
          /* noop */
        }
        n.disconnect?.()
      })
    }, fade * 1000 + 50)
  }

  // short UI tones for games (pop, chime)
  blip(freq = 600, dur = 0.12, type = 'sine', vol = 0.15) {
    try {
      const ctx = this.ensure()
      const t = ctx.currentTime
      const o = ctx.createOscillator()
      const g = ctx.createGain()
      o.type = type
      o.frequency.setValueAtTime(freq, t)
      o.frequency.exponentialRampToValueAtTime(freq * 1.8, t + dur)
      g.gain.setValueAtTime(vol, t)
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur)
      o.connect(g).connect(ctx.destination)
      o.start(t)
      o.stop(t + dur + 0.02)
    } catch {
      /* audio unavailable */
    }
  }
}

export const soundEngine = new SoundEngine()
