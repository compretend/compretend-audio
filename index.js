/* globals fetch */
const gza = require('gza')

const sort = arr => arr.sort((a, b) => {
  a = a.split(':').map(k => parseFloat(k))[0]
  b = b.split(':').map(k => parseFloat(k))[0]
  if (a < b) return -1
  /* istanbul ignore else */
  if (b < a) return 1
  /* istanbul ignore next */
  if (b === a) return 0
})
const values = obj => sort(Object.keys(obj)).map(key => obj[key])

gza`
<compretend-speaker ${['name']}>
</compretend-speaker>
`

const header = settings => {
  let speakers = new Map()
  values(settings.transcript).forEach(section => {
    /* istanbul ignore else */
    if (!speakers.has(section.speaker)) {
      // TODO: handle not string names
      let elem = document.createElement('compretend-speaker')
      elem.name = 'Speaker ' + section.speaker
      speakers.set(section, elem)
    }
  })
  return Array.from(speakers.values())
}

const paragraph = async settings => {
  let transcript = await settings.waitFor('transcript')
  let words = []
  sort(Object.keys(transcript)).forEach(timespan => {
    let [start, end] = timespan.split(':')
    let word = transcript[timespan]
    let elem = document.createElement('span')
    elem.className = 'word'
    elem.textContent = word
    elem.start = start
    elem.end = end
    words.push(elem)
  })
  return words
}

gza`
<compretend-section ${['transcript', 'timespan']}>
</compretend-section>
<style>
span.word {
  cursor: pointer;
  margin: 2px 2px 2px 2px;
}
</style>
<div class="section">
  <p>
  ${paragraph}
  </p>
</div>
`

const sections = async settings => {
  let transcript = await settings.waitFor('transcript')
  let ret = []
  sort(Object.keys(transcript)).forEach(timespan => {
    let section = transcript[timespan]
    let [start, end] = timespan.split(':')
    let elem = document.createElement('compretend-section')
    elem.timespan = timespan
    elem.start = parseFloat(start)
    elem.end = parseFloat(end)
    elem.id = `section-${timespan}`
    elem.speaker = section.speaker
    elem.transcript = section.transcript
    ret.push(elem)
  })
  return ret
}

gza`
${async element => {
  let userId = await element.waitFor('account')
  let filename = await element.waitFor('filename')
  let host = 'https://firebasestorage.googleapis.com'
  let audiourl = `${host}/v0/b/fs.compretend.com/o/${userId}%2F${filename}?alt=media`
  let fhost = 'https://us-central1-compretend.cloudfunctions.net'
  let transcriptUrl = `${fhost}/transcription/${userId}/${filename}`
  let res = await fetch(transcriptUrl)
  let transcript = await res.json()
  element.addSetting('transcript', transcript)
  element.audio = document.createElement('audio')
  element.audio.src = audiourl
}}
<compretend-audio ${['account', 'filename']}>
</compretend-audio>
<style>
div.sections
</style>
<div class="header">
  ${header}
</div>
<div class="sections">
  ${sections}
</div>
`
