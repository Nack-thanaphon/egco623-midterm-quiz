const groupMeta = {
  1: { label: 'DATA MINING & EXPLORING', weight: '15%' },
  2: { label: 'PREPROCESSING & MODELS', weight: '35%' },
  3: { label: 'ASSOCIATION RULES', weight: '25%' },
  4: { label: 'CLUSTERING', weight: '25%' },
}

const attemptCounts = { 1: 8, 2: 17, 3: 13, 4: 12 }
const pageSize = 10
let bank = []
let round = []
let pageIndex = 0
let pageChecked = false
let answers = {}
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

function currentPageQuestions() {
  const start = pageIndex * pageSize
  return round.slice(start, start + pageSize)
}

function createRound() {
  round = Object.entries(attemptCounts).flatMap(([group, count]) =>
    shuffle(bank.filter((question) => question.group === Number(group))).slice(0, count),
  )
  round = shuffle(round)
  pageIndex = 0
  pageChecked = false
  answers = {}
  correctCount = 0
  records = []
  showScreen('quiz')
  renderPage()
}

function renderPage() {
  const items = currentPageQuestions()
  const firstNumber = pageIndex * pageSize + 1
  const lastNumber = firstNumber + items.length - 1
  $('progressText').textContent = `หน้า ${pageIndex + 1} / ${round.length / pageSize} · ข้อ ${firstNumber}–${lastNumber}`
  $('liveScore').textContent = `ถูก ${correctCount}`
  $('progressBar').style.width = `${((pageIndex + 1) / (round.length / pageSize)) * 100}%`

  $('questionList').innerHTML = ''
  items.forEach((item, localIndex) => {
    const questionNumber = firstNumber + localIndex
    const selected = answers[item.id]
    const meta = groupMeta[item.group]
    const article = document.createElement('article')
    article.className = 'question-item'
    article.innerHTML = `
      <div class="question-meta"><span>${String(questionNumber).padStart(2, '0')} · ${meta.label}</span><em>${meta.weight}</em></div>
      <h2>${item.question}</h2>
      <div class="choices"></div>
      <div class="feedback hidden"></div>
    `

    const choices = article.querySelector('.choices')
    item.choices.forEach((choice, choiceIndex) => {
      const option = document.createElement('label')
      option.className = 'choice'
      if (selected === choiceIndex) option.classList.add('selected')
      if (pageChecked && choiceIndex === item.answer) option.classList.add('correct')
      if (pageChecked && selected === choiceIndex && choiceIndex !== item.answer) option.classList.add('wrong')

      const radio = document.createElement('input')
      radio.type = 'radio'
      radio.name = `question-${item.id}`
      radio.value = choiceIndex
      radio.checked = selected === choiceIndex
      radio.disabled = pageChecked
      radio.addEventListener('change', () => choose(item.id, choiceIndex))

      const text = document.createElement('span')
      text.className = 'choice-text'
      text.innerHTML = `<b>${choiceIndex + 1}.</b> ${choice}`
      option.append(radio, text)
      choices.appendChild(option)
    })

    if (pageChecked) {
      const feedback = article.querySelector('.feedback')
      const isCorrect = selected === item.answer
      feedback.className = `feedback ${isCorrect ? 'correct' : 'wrong'}`
      feedback.innerHTML = `<b>${isCorrect ? '✓ ถูกต้อง' : `✕ ยังไม่ถูก — คำตอบคือ ${item.choices[item.answer]}`}</b><p>${item.explanation}</p>`
    }
    $('questionList').appendChild(article)
  })

  const answered = items.filter((item) => answers[item.id] !== undefined).length
  $('answerStatus').textContent = pageChecked ? `ตรวจแล้ว ${items.length} ข้อ` : `ตอบแล้ว ${answered} / ${items.length}`
  $('checkPageBtn').disabled = answered !== items.length
  $('checkPageBtn').classList.toggle('hidden', pageChecked)
  $('nextPageBtn').classList.toggle('hidden', !pageChecked)
  $('nextPageBtn').textContent = pageIndex === round.length / pageSize - 1 ? 'ดูผลรวม →' : 'หน้าถัดไป →'
}

function choose(questionId, choiceIndex) {
  if (pageChecked) return
  answers[questionId] = choiceIndex
  renderPage()
}

function checkPage() {
  const items = currentPageQuestions()
  if (pageChecked || items.some((item) => answers[item.id] === undefined)) return
  pageChecked = true
  for (const item of items) {
    const selected = answers[item.id]
    const isCorrect = selected === item.answer
    if (isCorrect) correctCount += 1
    records.push({ item, selected, isCorrect })
  }
  renderPage()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function nextPage() {
  if (!pageChecked) return
  if (pageIndex === round.length / pageSize - 1) {
    renderResult()
    return
  }
  pageIndex += 1
  pageChecked = false
  renderPage()
  window.scrollTo({ top: 0, behavior: 'instant' })
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
    const response = await fetch('questions.json?v=5')
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
$('checkPageBtn').addEventListener('click', checkPage)
$('nextPageBtn').addEventListener('click', nextPage)

init()
