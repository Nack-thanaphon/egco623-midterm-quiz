const groupMeta = {
  1: { label: 'DATA MINING & EXPLORING', weight: '15%' },
  2: { label: 'PREPROCESSING & MODELS', weight: '35%' },
  3: { label: 'ASSOCIATION RULES', weight: '25%' },
  4: { label: 'CLUSTERING', weight: '25%' },
}

const attemptCounts = { 1: 8, 2: 17, 3: 13, 4: 12 }
let bank = []
let round = []
let currentIndex = 0
let selected = null
let checked = false
let correctCount = 0
let records = []

const $ = (id) => document.getElementById(id)

function shuffle(items) {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function showScreen(id) {
  for (const screen of document.querySelectorAll('.screen')) screen.classList.add('hidden')
  $(id).classList.remove('hidden')
  window.scrollTo({ top: 0, behavior: 'instant' })
}

function createRound() {
  round = Object.entries(attemptCounts).flatMap(([group, count]) =>
    shuffle(bank.filter((question) => question.group === Number(group))).slice(0, count),
  )
  round = shuffle(round)
  currentIndex = 0
  selected = null
  checked = false
  correctCount = 0
  records = []
  showScreen('quiz')
  renderQuestion()
}

function renderQuestion() {
  const item = round[currentIndex]
  const meta = groupMeta[item.group]
  $('progressText').textContent = `ข้อ ${currentIndex + 1} / ${round.length}`
  $('liveScore').textContent = `ถูก ${correctCount}`
  $('progressBar').style.width = `${((currentIndex + 1) / round.length) * 100}%`
  $('groupLabel').textContent = meta.label
  $('groupWeight').textContent = meta.weight
  $('questionText').textContent = item.question
  $('choices').innerHTML = ''

  item.choices.forEach((choice, index) => {
    const button = document.createElement('button')
    button.className = 'choice'
    if (selected === index) button.classList.add('selected')
    if (checked && index === item.answer) button.classList.add('correct')
    if (checked && selected === index && index !== item.answer) button.classList.add('wrong')
    button.disabled = checked
    button.innerHTML = `<span>${index + 1}</span><b>${choice}</b>`
    button.addEventListener('click', () => choose(index))
    $('choices').appendChild(button)
  })

  $('checkBtn').disabled = selected === null
  $('checkBtn').classList.toggle('hidden', checked)
  $('nextBtn').classList.toggle('hidden', !checked)
  $('nextBtn').textContent = currentIndex === round.length - 1 ? 'ดูผลรวม →' : 'ข้อต่อไป →'

  if (!checked) {
    $('feedback').className = 'feedback hidden'
    $('feedback').innerHTML = ''
  } else {
    const isCorrect = selected === item.answer
    $('feedback').className = `feedback ${isCorrect ? 'correct' : 'wrong'}`
    $('feedback').innerHTML = `<b>${isCorrect ? '✓ ถูกต้อง' : `✕ ยังไม่ถูก — คำตอบคือ ${item.choices[item.answer]}`}</b><p>${item.explanation}</p>`
  }
}

function choose(index) {
  if (checked) return
  selected = index
  renderQuestion()
}

function checkAnswer() {
  if (selected === null || checked) return
  checked = true
  const item = round[currentIndex]
  const isCorrect = selected === item.answer
  if (isCorrect) correctCount += 1
  records.push({ item, selected, isCorrect })
  renderQuestion()
}

function nextQuestion() {
  if (!checked) return
  if (currentIndex === round.length - 1) {
    renderResult()
    return
  }
  currentIndex += 1
  selected = null
  checked = false
  renderQuestion()
}

function renderResult() {
  const percent = Math.round((correctCount / round.length) * 100)
  $('scoreText').textContent = `${correctCount} / ${round.length}`
  $('scoreMessage').textContent = percent >= 80
    ? `${percent}% — ผ่านเป้าหมาย 80% แล้ว ทวนเฉพาะข้อผิดด้านล่าง`
    : `${percent}% — อ่านเหตุผลของข้อผิด แล้วสุ่มทำรอบใหม่`

  $('breakdown').innerHTML = Object.keys(groupMeta).map((group) => {
    const groupRecords = records.filter((record) => record.item.group === Number(group))
    const correct = groupRecords.filter((record) => record.isCorrect).length
    return `<div><b>${correct}/${groupRecords.length}</b><span>${groupMeta[group].label}</span></div>`
  }).join('')

  const wrong = records.filter((record) => !record.isCorrect)
  $('wrongReview').innerHTML = wrong.length === 0
    ? '<p class="all-correct">ถูกครบทุกข้อในรอบนี้ ✓</p>'
    : wrong.map((record, index) => `<article class="wrong-item">
        <h3>${index + 1}. ${record.item.question}</h3>
        <p class="your-answer"><b>ตอบ:</b> ${record.item.choices[record.selected]}</p>
        <p class="correct-answer"><b>คำตอบ:</b> ${record.item.choices[record.item.answer]}</p>
        <small>${record.item.explanation}</small>
      </article>`).join('')
  showScreen('result')
}

async function init() {
  try {
    const response = await fetch('questions.json')
    bank = await response.json()
    if (bank.length !== 100) throw new Error('Question bank must contain 100 questions')
    $('startBtn').disabled = false
  } catch (error) {
    $('startBtn').textContent = 'โหลดคลังข้อสอบไม่สำเร็จ'
    console.error(error)
  }
}

$('startBtn').disabled = true
$('startBtn').addEventListener('click', createRound)
$('restartBtn').addEventListener('click', createRound)
$('quitBtn').addEventListener('click', () => showScreen('start'))
$('checkBtn').addEventListener('click', checkAnswer)
$('nextBtn').addEventListener('click', nextQuestion)

document.addEventListener('keydown', (event) => {
  if (!$('quiz').classList.contains('hidden') && !checked && ['1', '2', '3', '4'].includes(event.key)) {
    choose(Number(event.key) - 1)
  } else if (!$('quiz').classList.contains('hidden') && event.key === 'Enter') {
    if (checked) nextQuestion()
    else checkAnswer()
  }
})

init()
