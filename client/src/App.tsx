import { useEffect, useMemo, useState } from 'react'
import { io, Socket } from 'socket.io-client'
import { getBoard, loadBoards, type BoardGrid } from './boards'

type Phase = 'lobby' | 'countdown' | 'calling'
type Page = 'welcome' | 'instructions' | 'depositSelect' | 'depositConfirm' | 'lobby' | 'game'

export default function App() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [playerId, setPlayerId] = useState<string>('')
  const [stake, setStake] = useState<number>(10)
  const [phase, setPhase] = useState<Phase>('lobby')
  const [seconds, setSeconds] = useState<number>(60)
  const [prize, setPrize] = useState<number>(0)
  const [players, setPlayers] = useState<number>(0)
  const [balance, setBalance] = useState<number>(0)
  const [bonus] = useState<number>(0)
  const [called, setCalled] = useState<number[]>([])
  const [picks, setPicks] = useState<number[]>([])
  const [currentPage, setCurrentPage] = useState<Page>('welcome')
  const [isReady, setIsReady] = useState<boolean>(false)
  const [markedNumbers, setMarkedNumbers] = useState<Set<number>>(new Set())
  const [callCountdown, setCallCountdown] = useState<number>(0)
  const [lastCalled, setLastCalled] = useState<number | null>(null)
  const [autoMark, setAutoMark] = useState<boolean>(false)
  const [autoAlgoMark, setAutoAlgoMark] = useState<boolean>(false)
  const [audioPack, setAudioPack] = useState<string>('amharic') // 'amharic' | 'modern-amharic'
  const [audioOn, setAudioOn] = useState<boolean>(true)
  const [selectedProvider, setSelectedProvider] = useState<string>('')
  const [depositAmount, setDepositAmount] = useState<string>('')
  // Legacy depositSms removed - using screenshot OCR instead
  const [depositImage, setDepositImage] = useState<File | null>(null)
  const [ocrLoading, setOcrLoading] = useState<boolean>(false)
  const [depositTimerSec, setDepositTimerSec] = useState<number>(0)
  const [depositWindowStart, setDepositWindowStart] = useState<number | null>(null)
  const [depositWindowEnd, setDepositWindowEnd] = useState<number | null>(null)

  useEffect(() => {
    const API_BASE =
      import.meta.env.VITE_API_URL ||
      (import.meta.env.PROD ? 'https://api.friendsbingo7.com' : 'http://localhost:3001')

    const s = io(API_BASE, { transports: ['websocket'] })
    setSocket(s)
    
    s.on('init', (d: any) => {
      setPhase(d.phase)
      setSeconds(d.seconds)
      setStake(d.stake)
      setPrize(d.prize)
      setCalled(d.called)
      setPlayerId(d.playerId)
      // If server is already in calling phase, go to game; otherwise keep current page
      if (d.phase === 'calling') {
        setCurrentPage('game')
      }
    })
    
    s.on('tick', (d: any) => { 
      setSeconds(d.seconds)
      setPlayers(d.players)
      setPrize(d.prize)
      setStake(d.stake)
    })
    
    s.on('phase', (d: any) => {
      setPhase(d.phase)
      // If game starts and we're in lobby, redirect to game
      if (d.phase === 'calling' && currentPage === 'lobby') {
        setCurrentPage('game')
      }
    })
    
    s.on('players', (d: any) => setPlayers(d.count))
    s.on('call', (d: any) => {
      setCalled(d.called)
      setLastCalled(d.number)
      setCallCountdown(3)
      if (autoMark || autoAlgoMark) {
        setMarkedNumbers(prev => {
          const next = new Set(prev)
          next.add(d.number)
          return next
        })
      }
      if (audioOn) {
        playCallSound(d.number)
      }
    })
    
    s.on('winner', (d: any) => { 
      alert(`Winner: ${d.playerId}\nPrize: ${d.prize}`)
      setPicks([])
      setMarkedNumbers(new Set())
      setCurrentPage('lobby')
      setIsReady(false)
    })
    
    s.on('game_start', () => {
      setCurrentPage('game')
    })
    
    s.on('start_game_confirm', () => {
      setCurrentPage('game')
    })
    
    return () => { s.disconnect() }
  }, [])

  // Restore picks from localStorage and persist changes
  useEffect(() => {
    try {
      const saved = localStorage.getItem('picks')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (Array.isArray(parsed)) setPicks(parsed)
      }
    } catch {}
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem('picks', JSON.stringify(picks))
    } catch {}
  }, [picks])

  // Load boards HTML
  useEffect(() => {
    fetch('/boards.html')
      .then((r) => r.text())
      .then((html) => { 
        loadBoards(html)
      })
      .catch(() => {
        console.error('Failed to load boards.html')
      })
  }, [])

  useEffect(() => { 
    if (socket && picks.length > 0) {
      socket.emit('select_numbers', picks) 
    }
  }, [socket, picks])

  // Deposit 3-minute timer countdown
  useEffect(() => {
    if (depositTimerSec <= 0) return
    const id = window.setInterval(() => {
      setDepositTimerSec(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [depositTimerSec])

  // Manage 3s per-call countdown lifecycle
  useEffect(() => {
    if (phase !== 'calling') {
      setCallCountdown(0)
      return
    }
    if (callCountdown <= 0) return
    const id = window.setInterval(() => {
      setCallCountdown(prev => (prev > 0 ? prev - 1 : 0))
    }, 1000)
    return () => window.clearInterval(id)
  }, [phase, callCountdown])

  const board = useMemo(() => Array.from({ length: 100 }, (_, i) => i + 1), [])

  const togglePick = (n: number) => {
    if (phase !== 'lobby' && phase !== 'countdown') return
    setPicks(prev => {
      if (prev.includes(n)) return prev.filter(x => x !== n)
      if (prev.length >= 2) return prev
      return [...prev, n]
    })
  }

  const handleStartGame = () => {
    if (picks.length === 0) {
      alert('Please select at least one board before starting!')
      return
    }
    setIsReady(true)
    socket?.emit('start_game')
    // Redirect immediately; server continues countdown and will also emit confirmations
    setCurrentPage('game')
  }

  const toggleMark = (number: number) => {
    if (phase !== 'calling') return
    if (autoAlgoMark) return // disable manual marking when auto algorithm is enabled
    setMarkedNumbers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(number)) {
        newSet.delete(number)
      } else {
        newSet.add(number)
      }
      return newSet
    })
  }

  const checkBingo = (board: BoardGrid): boolean => {
    // Check rows
    for (let row = 0; row < 5; row++) {
      let count = 0
      for (let col = 0; col < 5; col++) {
        const idx = row * 5 + col
        const num = board[idx]
        if (num === -1 || markedNumbers.has(num)) count++
      }
      if (count === 5) return true
    }
    
    // Check columns
    for (let col = 0; col < 5; col++) {
      let count = 0
      for (let row = 0; row < 5; row++) {
        const idx = row * 5 + col
        const num = board[idx]
        if (num === -1 || markedNumbers.has(num)) count++
      }
      if (count === 5) return true
    }
    
    // Check diagonals
    let count1 = 0, count2 = 0
    for (let i = 0; i < 5; i++) {
      const num1 = board[i * 5 + i]
      const num2 = board[i * 5 + (4 - i)]
      if (num1 === -1 || markedNumbers.has(num1)) count1++
      if (num2 === -1 || markedNumbers.has(num2)) count2++
    }
    return count1 === 5 || count2 === 5
  }

  const canBingo = picks.some(boardId => {
    const board = getBoard(boardId)
    return board ? checkBingo(board) : false
  })

  // Ensure a win line exists that includes the most recent called number
  const hasBingoIncludingLastCalled = (): boolean => {
    if (!lastCalled) return false
    // Effective marked set: when auto algorithm is on, use called numbers as marks
    const effectiveMarks = new Set<number>(autoAlgoMark ? called : Array.from(markedNumbers))
    for (const boardId of picks) {
      const grid = getBoard(boardId)
      if (!grid) continue
      // map grid indices to numbers for quick checks
      const lines: number[][] = []
      // rows
      for (let r = 0; r < 5; r++) {
        lines.push([0,1,2,3,4].map(c => grid[r*5 + c]))
      }
      // cols
      for (let c = 0; c < 5; c++) {
        lines.push([0,1,2,3,4].map(r => grid[r*5 + c]))
      }
      // diagonals
      lines.push([0,1,2,3,4].map(i => grid[i*5 + i]))
      lines.push([0,1,2,3,4].map(i => grid[i*5 + (4-i)]))

      for (const line of lines) {
        const containsLast = line.includes(lastCalled)
        if (!containsLast) continue
        const complete = line.every(n => n === -1 || effectiveMarks.has(n))
        if (complete) return true
      }
    }
    return false
  }

  const onPressBingo = () => {
    // Validate locally before notifying server
    if (!hasBingoIncludingLastCalled()) {
      alert('No valid BINGO found that includes the last called number. Keep marking!')
      return
    }
    socket?.emit('bingo')
  }

  // Render 75-number caller grid with B I N G O columns
  const renderCallerGrid = () => {
    // Build columns: B(1-15), I(16-30), N(31-45), G(46-60), O(61-75)
    const columns: number[][] = [
      Array.from({ length: 15 }, (_, i) => i + 1),
      Array.from({ length: 15 }, (_, i) => i + 16),
      Array.from({ length: 15 }, (_, i) => i + 31),
      Array.from({ length: 15 }, (_, i) => i + 46),
      Array.from({ length: 15 }, (_, i) => i + 61),
    ]

    const headers = ['B', 'I', 'N', 'G', 'O']

  return (
      <div>
        <div className="grid grid-cols-5 gap-1 mb-2">
          {headers.map(h => (
            <div key={h} className="text-center font-bold text-slate-300">{h}</div>
          ))}
        </div>
        <div className="grid grid-cols-5 gap-1">
          {columns.map((col, cIdx) => (
            <div key={cIdx} className="grid grid-rows-15 gap-1">
              {col.map((n) => {
                const isCalled = called.includes(n)
                return (
                  <div
                    key={n}
                    className={[
                      'h-7 w-full rounded text-xs md:text-sm flex items-center justify-center border',
                      isCalled ? 'bg-emerald-500 border-emerald-400 text-black' : 'bg-slate-700 border-slate-600 text-slate-300'
                    ].join(' ')}
                  >
                    {n}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Audio: try to play a sound for each call using selected pack
  const numberToLetter = (n: number) => (n <= 15 ? 'B' : n <= 30 ? 'I' : n <= 45 ? 'N' : n <= 60 ? 'G' : 'O')
  // Very simple SMS parser; expects date/time in the message. Adjust patterns as needed per provider
  const parseSmsTimestamp = (sms: string, windowStart?: number | null): number | null => {
    // Support: YYYY-MM-DD HH:MM(:SS)?( AM|PM)?, DD/MM/YYYY HH:MM(:SS)?( AM|PM)?, or HH:MM(:SS)?( AM|PM)?
    const s = sms.trim()
    let m = s.match(/(20\d{2})[-\/](\d{1,2})[-\/](\d{1,2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i)
    if (!m) m = s.match(/(\d{1,2})[-\/](\d{1,2})[-\/](20\d{2})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i)
    if (m) {
      const parts = m.map(x => (x||'').toString())
      let y: number, mo: number, d: number, h: number, mi: number, se: number
      if (m[1].length === 4) { // YYYY-first
        y = Number(parts[1]); mo = Number(parts[2])-1; d = Number(parts[3]); h = Number(parts[4]); mi = Number(parts[5]); se = Number(parts[6]||'0')
      } else { // DD/MM/YYYY
        d = Number(parts[1]); mo = Number(parts[2])-1; y = Number(parts[3]); h = Number(parts[4]); mi = Number(parts[5]); se = Number(parts[6]||'0')
      }
      const ampm = (parts[7]||'').toUpperCase()
      if (ampm === 'PM' && h < 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      const dt = new Date(y, mo, d, h, mi, se)
      return dt.getTime()
    }
    // Time-only; align to same day as windowStart if provided, else today
    const t = s.match(/\b(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?\b/i)
    if (t) {
      const parts = t.map(x => (x||'').toString())
      let h = Number(parts[1]); const mi = Number(parts[2]); const se = Number(parts[3]||'0'); const ampm = (parts[4]||'').toUpperCase()
      if (ampm === 'PM' && h < 12) h += 12
      if (ampm === 'AM' && h === 12) h = 0
      const base = windowStart ? new Date(windowStart) : new Date()
      const dt = new Date(base.getFullYear(), base.getMonth(), base.getDate(), h, mi, se)
      return dt.getTime()
    }
    return null
  }

  // --- OCR utilities for screenshot verification ---
  const loadTesseract = async (): Promise<any> => {
    if ((window as any).Tesseract) return (window as any).Tesseract
    await new Promise<void>((resolve, reject) => {
      const s = document.createElement('script')
      s.src = 'https://unpkg.com/tesseract.js@4.1.1/dist/tesseract.min.js'
      s.async = true
      s.onload = () => resolve()
      s.onerror = () => reject(new Error('Failed to load OCR'))
      document.head.appendChild(s)
    })
    return (window as any).Tesseract
  }

  const ocrImageToText = async (file: File): Promise<string> => {
    const Tesseract = await loadTesseract()
    const { data } = await Tesseract.recognize(file, 'eng')
    return (data?.text as string) || ''
  }

  const parseTransactionId = (text: string): string | null => {
    // Look for common tags: Txn, Trans, Ref, Reference
    const tag = text.match(/(?:txn|trans|ref|reference)[:\s-]*([A-Z0-9]{6,})/i)
    if (tag) return tag[1].trim()
    // Fallback: longest uppercase/digit token 8-20 chars
    const tokens = text.match(/[A-Z0-9]{8,20}/g)
    return tokens ? tokens.sort((a,b)=>b.length-a.length)[0] : null
  }

  const hasSeenTxn = (id: string): boolean => {
    try {
      const raw = localStorage.getItem('seenTxnIds')
      const set = raw ? new Set<string>(JSON.parse(raw)) : new Set<string>()
      return set.has(id)
    } catch { return false }
  }
  const rememberTxn = (id: string) => {
    try {
      const raw = localStorage.getItem('seenTxnIds')
      const arr: string[] = raw ? JSON.parse(raw) : []
      if (!arr.includes(id)) arr.push(id)
      localStorage.setItem('seenTxnIds', JSON.stringify(arr.slice(-200)))
    } catch {}
  }
  const playCallSound = async (n: number) => {
    const letter = numberToLetter(n)
    // Always fetch audio from the server to avoid client-origin path issues
    const base = `${import.meta.env.PROD ? window.location.origin : 'http://localhost:3001'}/audio/${audioPack}`
    const candidates = [
      `${base}/${letter}-${n}.mp3`,
      `${base}/${letter}_${n}.mp3`,
      `${base}/${letter}/${n}.mp3`,
      `${base}/${n}.mp3`,
      `${base}/${letter}${n}.mp3`,
    ]
    for (const src of candidates) {
      try {
        await new Promise<void>((resolve, reject) => {
          const audio = new Audio(src)
          audio.oncanplaythrough = () => {
            audio.play().then(() => resolve()).catch(reject)
          }
          audio.onerror = reject
        })
        break
      } catch (_) {
        continue
      }
    }
  }

  const renderCard = (boardId: number | null, isGamePage: boolean = false) => {
    if (!boardId) return null
    const grid: BoardGrid | null = getBoard(boardId)
    if (!grid) return (
      <div className="text-slate-400">Board {boardId} not found</div>
    )
    return (
      <div className="grid grid-cols-5 gap-1">
        {grid.map((val, idx) => {
          const isFree = val === -1
          const isMarked = isFree || markedNumbers.has(val)
          const isCalled = called.includes(val)
          const shouldHighlight = isGamePage 
            ? (autoAlgoMark ? (isFree || isCalled) : isMarked)
            : isCalled

  return (
            <div 
              key={idx} 
              onClick={() => isGamePage && !isFree && isCalled && toggleMark(val)}
              className={[
                'h-7 w-full rounded text-xs flex items-center justify-center border cursor-pointer',
                shouldHighlight ? 'bg-emerald-500 border-emerald-400 text-black' : 'bg-slate-700 border-slate-600',
                isGamePage && !isFree && isCalled ? 'hover:brightness-110' : ''
              ].join(' ')}
            >
              {isFree ? 'FREE' : val}
            </div>
          )
        })}
      </div>
    )
  }

  const renderLobbyPage = () => (
    <div className="min-h-full bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <div className="bg-slate-800 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="text-slate-300 text-sm">ID: <span className="font-mono">{playerId.slice(0,8)}</span></div>
            <div className="flex gap-4 text-sm">
              <span>Stake: <b>{stake.toFixed(2)}</b></span>
              <span>Players: <b>{players}</b></span>
              <span>Prize: <b>{prize}</b></span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-6">
            <div className="text-2xl font-bold">Select Your Boards</div>
            <div className="px-4 py-2 rounded bg-slate-700 font-mono text-lg">
              {String(seconds).padStart(2,"0")}s
            </div>
          </div>

          {/* Audio and Auto Mark toggles visible before countdown */}
          <div className="flex flex-wrap items-center gap-6 mb-6">
            <label className="flex items-center gap-2 text-sm">
              <span className="text-slate-300">Audio:</span>
              <select
                className="bg-slate-700 text-slate-100 rounded px-2 py-1"
                value={audioPack}
                onChange={(e) => setAudioPack(e.target.value)}
              >
                <option value="amharic">Amharic</option>
                <option value="modern-amharic">Modern Amharic</option>
              </select>
              <input type="checkbox" checked={audioOn} onChange={(e) => setAudioOn(e.target.checked)} />
              <button
                className="ml-2 px-2 py-1 rounded bg-slate-700 hover:brightness-110"
                onClick={() => playCallSound(1)}
              >
                Test
              </button>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoMark}
                onChange={(e) => setAutoMark(e.target.checked)}
              />
              <span className="text-slate-300">Auto mark (me)</span>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={autoAlgoMark}
                onChange={(e) => setAutoAlgoMark(e.target.checked)}
              />
              <span className="text-slate-300">Auto algorithm mark</span>
            </label>
          </div>
          
          <div className="grid grid-cols-10 gap-2 mb-6">
            {board.map(n => {
              const isPicked = picks.includes(n)
              const disabled = phase !== 'lobby' && phase !== 'countdown'
              return (
                <button
                  key={n}
                  onClick={() => togglePick(n)}
                  disabled={disabled}
                  className={[
                    "aspect-square rounded text-xs md:text-sm flex items-center justify-center border font-semibold",
                    isPicked ? "bg-amber-500 border-amber-400 text-black" : "bg-slate-700 border-slate-600",
                    disabled ? "opacity-60 cursor-not-allowed" : "hover:brightness-110"
                  ].join(" ")}
                >
                  {n}
                </button>
              )
            })}
          </div>
          
          {/* Selected Boards Preview */}
          {picks.length > 0 && (
            <div className="mb-6">
              <div className="text-slate-300 mb-4">Your Selected Boards ({picks.length}/2):</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {picks.map((boardId) => (
                  <div key={boardId} className="bg-slate-700 rounded-lg p-4">
                    <div className="text-sm text-slate-400 mb-2">Board {boardId}</div>
                    {renderCard(boardId, false)}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            <div className="text-slate-300">
              Selected: {picks.length}/2 boards
              {picks.length > 0 && (
                <div className="flex gap-2 mt-2">
                  {picks.map(n => (
                    <span key={n} className="px-2 py-1 bg-amber-500 text-black rounded text-sm">Board {n}</span>
                  ))}
                </div>
              )}
            </div>
            
            <button
              onClick={handleStartGame}
              disabled={picks.length === 0 || isReady}
              className={`px-6 py-3 rounded-lg font-bold text-lg ${
                picks.length > 0 && !isReady 
                  ? 'bg-green-500 hover:bg-green-600 text-black' 
                  : 'bg-slate-700 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isReady ? 'Ready!' : 'Start Game'}
        </button>
          </div>
        </div>
      </div>
    </div>
  )

  // Welcome page with balance, deposit, instructions, invite, and bet houses
  const renderWelcomePage = () => (
    <div className="min-h-full bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-5xl space-y-6">
        <div className="flex items-center justify-between">
          <div className="text-2xl font-bold">Hello, Player!</div>
          <button
            className="px-4 py-2 rounded bg-amber-500 text-black font-semibold"
            onClick={() => setCurrentPage('depositSelect')}
          >
            + Deposit
          </button>
        </div>

        {/* Balance card */}
        <div className="bg-rose-500/80 rounded-xl p-5 flex items-center justify-between">
          <div>
            <div className="uppercase text-xs">Balance</div>
            <div className="text-3xl font-extrabold">{balance} Birr</div>
            <div className="mt-2 text-xs opacity-90">Bonus</div>
            <div className="text-lg font-bold">{bonus} Birr</div>
          </div>
          <div className="text-6xl font-black opacity-60">ETB</div>
        </div>

        <div className="flex items-center justify-between">
          <button
            className="px-4 py-3 rounded bg-slate-800 hover:bg-slate-700"
            onClick={() => setCurrentPage('instructions')}
          >
            Instructions
          </button>
          <button
            className="px-4 py-3 rounded bg-slate-800 hover:bg-slate-700"
            onClick={() => navigator.clipboard.writeText(`${window.location.origin}/?ref=${playerId}`)}
          >
            Invite Friends (copy link)
          </button>
        </div>

        <div className="text-xl font-semibold">Play</div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Mini', amount: 10, tag: 15, color: 'bg-sky-600' },
            { label: 'Sweety', amount: 20, tag: 74, color: 'bg-orange-500' },
            { label: 'Standard', amount: 50, tag: 40, color: 'bg-violet-600' },
            { label: 'Grand', amount: 100, tag: 60, color: 'bg-teal-600' },
          ].map(card => (
            <div key={card.amount} className={`${card.color} rounded-xl p-5 flex flex-col gap-4`}>
              <div className="text-sm opacity-90">{card.label}</div>
              <div className="text-3xl font-extrabold">{card.amount} Birr</div>
              <div className="mt-auto flex items-center justify-between">
                <button
                  className="px-4 py-2 rounded bg-black/30 hover:bg-black/40"
                  onClick={() => {
                    setStake(card.amount)
                    socket?.emit('set_stake', card.amount)
                    setCurrentPage('lobby')
                  }}
                >
                  Play now
                </button>
                <div className="h-12 w-12 rounded-full bg-black/20 flex items-center justify-center text-xl font-black">{card.tag}</div>
              </div>
            </div>
          ))}
          {/* Extra 200 birr */}
          <div className={`bg-emerald-600 rounded-xl p-5 flex flex-col gap-4`}>
            <div className="text-sm opacity-90">Elite</div>
            <div className="text-3xl font-extrabold">200 Birr</div>
            <div className="mt-auto flex items-center justify-between">
              <button
                className="px-4 py-2 rounded bg-black/30 hover:bg-black/40"
                onClick={() => {
                  setStake(200)
                  socket?.emit('set_stake', 200)
                  setCurrentPage('lobby')
                }}
              >
                Play now
              </button>
              <div className="h-12 w-12 rounded-full bg-black/20 flex items-center justify-center text-xl font-black">75</div>
            </div>
          </div>
        </div>

        <div className="text-xs text-slate-400">Version preview</div>
      </div>
    </div>
  )

  const renderInstructionsPage = () => (
    <div className="min-h-full bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl bg-slate-800 rounded-xl p-6 space-y-4">
        <div className="text-2xl font-bold mb-2">How to play</div>
        <ol className="list-decimal space-y-2 ml-5 text-slate-200 text-sm">
          <li>Choose a bet house (10/20/50/100/200 Birr).</li>
          <li>Select up to 2 boards in the lobby.</li>
          <li>Press Start Game to enter the live game.</li>
          <li>During calling, mark called numbers on your boards or enable auto mark.</li>
          <li>Press BINGO only when a full row/column/diagonal is complete including the last call.</li>
        </ol>
        <div className="text-2xl font-bold mt-6">Deposits & Withdrawals</div>
        <p className="text-slate-200 text-sm">Use the Deposit button on the Welcome page. Withdrawal flow can be added similarly.</p>
        <div className="flex justify-end">
          <button className="px-4 py-2 rounded bg-slate-700" onClick={() => setCurrentPage('welcome')}>Back</button>
        </div>
      </div>
    </div>
  )

  const providers = [
    { id: 'telebirr', name: 'Telebirr', logo: '🌀' },
    { id: 'ebirr', name: 'Ebirr', logo: '🟢' },
    { id: 'cbe', name: 'CBE', logo: '🏦' },
    { id: 'awash', name: 'Awash', logo: '🏦' },
    { id: 'dashen', name: 'Dashen', logo: '🏦' },
    { id: 'boa', name: 'Bank of Abyssinia', logo: '🏦' },
  ]

  const providerToAccount: Record<string, { account: string; name: string }> = {
    telebirr: { account: '0966 000 0000', name: 'Company Telebirr' },
    ebirr: { account: '0911 000 000', name: 'Company Ebirr' },
    cbe: { account: '1000533912889', name: 'Eyoel Michael' },
    awash: { account: '0111 2222 3333', name: 'Company Awash' },
    dashen: { account: '0123 4567 8901', name: 'Company Dashen' },
    boa: { account: '0222 3333 4444', name: 'Company BoA' },
  }

  const renderDepositSelect = () => (
    <div className="min-h-full bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        <div className="text-2xl font-bold mb-4">Select Payment Platform</div>
        <div className="bg-emerald-600/80 rounded-lg px-4 py-2 text-sm mb-3">Recommended</div>
        <div className="space-y-3">
          {providers.map(p => (
            <button
              key={p.id}
              onClick={() => { setSelectedProvider(p.id); setCurrentPage('depositConfirm') }}
              className="w-full bg-slate-800 hover:bg-slate-700 rounded-xl p-4 flex items-center justify-between border border-slate-700"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">{p.logo}</div>
                <div className="text-lg">{p.name}</div>
              </div>
              <div className="text-slate-400">›</div>
            </button>
          ))}
        </div>
        <div className="mt-6">
          <button className="px-4 py-2 bg-slate-800 rounded" onClick={() => setCurrentPage('welcome')}>Back</button>
        </div>
      </div>
    </div>
  )

  const renderDepositConfirm = () => {
    const info = providerToAccount[selectedProvider] || { account: '—', name: '—' }
    return (
      <div className="min-h-full bg-slate-900 text-white flex items-center justify-center p-4">
        <div className="w-full max-w-3xl space-y-4">
          <div className="text-2xl font-bold">Confirm payment</div>
          <div>
            <div className="text-slate-300 text-sm mb-2">Deposit account</div>
            <div className="bg-slate-800 rounded-xl p-4 border border-slate-700">
              <div className="text-lg font-mono">{info.account}</div>
              <div className="text-sm text-slate-400 mt-1">{info.name}</div>
            </div>
          </div>
          <div className="space-y-3">
            <input
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              placeholder="Amount"
              className="w-full bg-slate-800 rounded-xl p-3 border border-slate-700 outline-none"
            />
            <div className="flex items-center gap-3">
              <button
                className="px-3 py-2 rounded bg-emerald-600 text-black font-semibold"
                onClick={() => {
                  setDepositTimerSec(180)
                  const start = Date.now()
                  setDepositWindowStart(start)
                  setDepositWindowEnd(start + 180000)
                }}
              >
                Start 3:00 Timer
              </button>
              <div className="font-mono text-slate-300">
                {depositTimerSec > 0 ? `${Math.floor(depositTimerSec/60)}:${String(depositTimerSec%60).padStart(2,'0')}` : 'Not started'}
              </div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-slate-300">Upload deposit screenshot</div>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setDepositImage(e.target.files?.[0] || null)}
                className="w-full bg-slate-800 rounded-xl p-3 border border-slate-700 outline-none"
              />
              {depositImage && (
                <div className="text-xs text-slate-400">{depositImage.name} ({Math.round(depositImage.size/1024)} KB)</div>
              )}
            </div>
            <button
              className="w-full py-3 rounded-xl bg-emerald-600 text-black font-bold disabled:opacity-60"
              disabled={!depositAmount || !depositImage || ocrLoading}
              onClick={async () => {
                const amountNum = Number(depositAmount)
                if (!Number.isFinite(amountNum) || amountNum <= 0) {
                  alert('Enter a valid amount')
                  return
                }
                if (!depositImage) return
                setOcrLoading(true)
                try {
                  const text = await ocrImageToText(depositImage)
                  // Check account holder and number
                  const okName = text.toLowerCase().includes(info.name.toLowerCase())
                  const okAcct = text.replace(/\s+/g,'').includes(info.account.replace(/\s+/g,''))
                  if (!okName || !okAcct) {
                    alert('Could not verify name or account on the screenshot')
                    setOcrLoading(false)
                    return
                  }
                  // Extract a transaction id and ensure uniqueness locally
                  const txn = parseTransactionId(text)
                  if (txn && hasSeenTxn(txn)) {
                    alert('This transaction reference was already used')
                    setOcrLoading(false)
                    return
                  }
                  // Extract time; accept deposits at/before now. If a timer window exists, prefer checking within it; else allow any recent time today
                  const ts = parseSmsTimestamp(text, depositWindowStart || Date.now())
                  if (!ts) {
                    alert('Could not read time from screenshot')
                    setOcrLoading(false)
                    return
                  }
                  const now = Date.now()
                  if (ts > now + 2*60_000) { // future by >2min
                    alert('Screenshot time appears invalid (in the future)')
                    setOcrLoading(false)
                    return
                  }
                  // If timer exists, require ts between start-1min and end+2min
                  if (depositWindowStart && depositWindowEnd) {
                    const slackStart = depositWindowStart - 60_000
                    const slackEnd = depositWindowEnd + 120_000
                    if (ts < slackStart || ts > slackEnd) {
                      alert('Screenshot time not within the deposit window')
                      setOcrLoading(false)
                      return
                    }
                  }
                  // Accept: credit balance, remember txn id, reset and redirect
                  if (txn) rememberTxn(txn)
                  setBalance(prev => prev + amountNum)
                  setDepositAmount('')
                  setDepositImage(null)
                  setDepositTimerSec(0)
                  setDepositWindowStart(null)
                  setDepositWindowEnd(null)
                  setCurrentPage('welcome')
                } catch (e:any) {
                  alert(e?.message || 'Failed to verify screenshot')
                } finally {
                  setOcrLoading(false)
                }
              }}
            >
              {ocrLoading ? 'Verifying…' : 'Submit Deposit'}
            </button>
          </div>
          <div className="mt-6">
            <div className="text-xl font-semibold mb-2">How to deposit</div>
            <div className="bg-slate-800 rounded-xl p-4 text-slate-300 text-sm">Send the amount to the account above using your selected platform, then paste the confirmation SMS here and submit.</div>
          </div>
          <div>
            <button className="px-4 py-2 bg-slate-800 rounded" onClick={() => setCurrentPage('depositSelect')}>Back</button>
          </div>
        </div>
      </div>
    )
  }


  const renderGamePage = () => (
    <div className="min-h-full bg-slate-900 text-white flex items-center justify-center p-4">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Game Info */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="text-slate-300 text-sm">ID: <span className="font-mono">{playerId.slice(0,8)}</span></div>
            <div className="flex gap-3 text-sm">
              <span>Stake: <b>{stake.toFixed(2)}</b></span>
              <span>Players: <b>{players}</b></span>
              <span>Prize: <b>{prize}</b></span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="text-lg font-semibold">Live Game</div>
            <div className="flex items-center gap-2">
              <div className="px-3 py-1 rounded bg-slate-700 font-mono" title="Time until next game start">
                {String(seconds).padStart(2,"0")}s
              </div>
              {phase === 'calling' && (
                <div className="px-3 py-1 rounded bg-emerald-700 font-mono" title="Next call in">
                  {String(callCountdown).padStart(2,'0')}s
                </div>
              )}
            </div>
          </div>

          {/* Big last-called number display */}
          {phase === 'calling' && (
            <div className="flex items-center justify-between mb-4">
              <div className="text-4xl md:text-5xl font-black tracking-wide">
                {lastCalled ? `${lastCalled <= 15 ? 'B' : lastCalled <= 30 ? 'I' : lastCalled <= 45 ? 'N' : lastCalled <= 60 ? 'G' : 'O'}-${lastCalled}` : 'Waiting...'}
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <span className="text-slate-300">Audio:</span>
                  <select
                    className="bg-slate-700 text-slate-100 rounded px-2 py-1"
                    value={audioPack}
                    onChange={(e) => setAudioPack(e.target.value)}
                  >
                    <option value="amharic">Amharic</option>
                    <option value="modern-amharic">Modern Amharic</option>
                  </select>
                  <input type="checkbox" checked={audioOn} onChange={(e) => setAudioOn(e.target.checked)} />
                  <button
                    className="ml-2 px-2 py-1 rounded bg-slate-700 hover:brightness-110"
                    onClick={() => lastCalled ? playCallSound(lastCalled) : undefined}
                  >
                    Test
                  </button>
                </label>
              </div>
            </div>
          )}
          
          <div className="text-slate-300 mb-2">Caller:</div>
          <div className="mb-6">
            {renderCallerGrid()}
          </div>
          
          <button
            onClick={onPressBingo}
            disabled={autoAlgoMark ? false : !canBingo}
            className={`w-full py-3 rounded text-lg font-bold ${
              autoAlgoMark || canBingo
                ? 'bg-fuchsia-500 hover:brightness-110 text-black' 
                : 'bg-slate-700 text-slate-400 cursor-not-allowed'
            }`}
          >
            BINGO!
          </button>
        </div>

        {/* Player Boards - vertical list */}
        <div className="bg-slate-800 rounded-xl p-4">
          <div className="text-slate-300 mb-4">Your Boards:</div>
          <div className="flex flex-col gap-6">
            {picks.map((boardId) => (
              <div key={boardId} className="text-center">
                <div className="text-sm text-slate-400 mb-2">Board {boardId}</div>
                {renderCard(boardId, true)}
              </div>
            ))}
          </div>
          <div className="mt-4 text-xs text-slate-400">
            Click on called numbers to mark them. FREE is always marked.
          </div>
        </div>
      </div>
    </div>
  )

  if (currentPage === 'welcome') return renderWelcomePage()
  if (currentPage === 'instructions') return renderInstructionsPage()
  if (currentPage === 'depositSelect') return renderDepositSelect()
  if (currentPage === 'depositConfirm') return renderDepositConfirm()
  if (currentPage === 'lobby') return renderLobbyPage()
  return renderGamePage()
}