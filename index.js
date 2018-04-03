/* globals fetch */
const gza = require('gza')
const cl = require('class-list')

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

const paragraph = transcript => {
  let words = []
  sort(Object.keys(transcript)).forEach(timespan => {
    let [start, end] = timespan.split(':').map(parseFloat)
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
${async element => {
  let avatar = element.avatar || `https://api.adorable.io/avatars/280/${encodeURIComponent(element.speaker)}.png`
  element.avatar = avatar
  element.text = paragraph(await element.waitFor('transcript'))
  element.text.forEach(elem => {
    elem.onclick = () => {
      element.audio.currentTime = elem.start
      element.audio.play()
    }
  })
}}
<compretend-section ${
  ['transcript', 'timespan', 'speaker', 'text', 'audio', 'avatar']
}>
</compretend-section>
<style>
span.word {
  cursor: pointer;
}
span.word:after {
  content: " ";
}
div.section {
  display: flex;
  display: flex;
  width: 100%;
  margin-bottom: 10px;
}
:host {
  width: 100%
}
div.speaker {
  display: flex;
  width: 50px;
  margin-left: 5px;
  margin-right: 10px;
}
div.speaker img {
  width: 50px;
  height: 50px;
  border-radius: 5px;
}
div.speaker-content {
  width: 100%;
  flex-grow: 1;
}
div.speaker-name {
  width: 100%;
  flex-grow: 1;
}
div.text:first-letter {
  text-transform: capitalize
}
div.text {
  z-index: -100;
  margin-top: 20px;
  margin-bottom: -5px;
  margin-left: -35px;
  padding-left: 35px;
  border-left: 2px dotted black;
}
div.speaker-name h4 {
  margin-bottom: 15px;
  margin-top: 15px
}
span.playing {
  font-weight: 600;
  letter-spacing: -0.065em;
}
</style>
<div class="section">
  <div class="speaker">
    <img src="${settings => settings.avatar}"><img>
  </div>
  <div class="speaker-content">
    <div class="speaker-name">
      <h4>${settings => settings.speaker}</h4>
    </div>
    <div class="text">
      ${settings => settings.text}
    </div>
  </div>
</div>
`

const sections = (transcript, audio) => {
  let ret = []
  sort(Object.keys(transcript)).forEach(timespan => {
    let section = transcript[timespan]
    let [start, end] = timespan.split(':')
    let elem = document.createElement('compretend-section')
    elem.timespan = timespan
    elem.start = parseFloat(start)
    elem.end = parseFloat(end)
    elem.id = `section-${timespan}`
    elem.audio = audio
    if (typeof section.speaker === 'number') {
      elem.speaker = `Speaker ${section.speaker}`
    } else {
      elem.speaker = section.speaker.name
      elem.avatar = section.speaker.avatar
    }
    // if (typeof section.speaker === 'number') {

    // } else {
    //   elem.speaker = section.speaker
    // }
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
  element.addSetting('audio', document.createElement('audio'))
  element.audio.src = audiourl
  element.addSetting('sections', sections(transcript, element.audio))

  let texts = element.sections.map(section => section.waitFor('text'))
  texts = await Promise.all(texts)
  let spans = [].concat(...texts)

  let i = 0
  let timeout
  let updatetime = () => {
    let time = element.audio.currentTime
    cl(spans[i]).remove('playing')
    while (spans[i + 1] && spans[i + 1].start < time) {
      i = i + 1
    }
    cl(spans[i]).add('playing')
    let start = spans[i + 1] ? spans[i + 1].start : null
    return (start || time + 0.01) - time
  }
  element.audio.onplaying = () => {
    let cb = () => {
      let t = updatetime()
      timeout = setTimeout(cb, t * 1000)
    }
    cb()
  }
  element.audio.onended = () => {
    clearTimeout(timeout)
    cl(spans[i]).remove('playing')
  }
  element.spans = spans

  let last = element.sections[element.sections.length - 1]
  await last.nextRender()
  last.shadowRoot.querySelector('div.text').style = 'border-left: none;'
}}
<compretend-audio ${['account', 'filename']}>
</compretend-audio>
<style>
div.sections {
  display: flex;
  flex-wrap: wrap;
  flex-flow: row wrap;
  width: 100%;
}
:host:after {

}
:host {
  font-family: Verdana, Geneva, sans-serif;
}
</style>
<div class="header">
  ${header}
</div>
<div class="sections">
  ${settings => settings.sections}
</div>
`
