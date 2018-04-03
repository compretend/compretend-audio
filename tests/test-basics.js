const path = require('path')
const cappadonna = require('cappadonna')
const sleep = require('sleep-promise')
const test = cappadonna(path.join(__dirname, 'components.js'))

test('basic file', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    document.body.innerHTML += `
    <compretend-audio
      account="cYahuVpWBlg1gfamVTctazb5PGL2"
      filename="alex-russell-short.mp3">
    </compretend-audio>
    `
    await document.querySelector('compretend-audio').nextRender()
    let el = document.querySelector('compretend-audio')
    t.same(el.filename, 'alex-russell-short.mp3')
  })
})

test('play transcript', async (page, t) => {
  t.plan(2)
  let pos = await page.evaluate(async () => {
    document.body.innerHTML += `
    <compretend-audio
      account="cYahuVpWBlg1gfamVTctazb5PGL2"
      filename="alex-russell-short.mp3">
    </compretend-audio>
    `
    await document.querySelector('compretend-audio').nextRender()
    let el = document.querySelector('compretend-audio')
    let rect = el.spans[100].getBoundingClientRect()
    return rect.x + ':' + rect.y
  })
  let [x, y] = pos.split(':').map(parseFloat)
  await page.mouse.click(x, y)
  await sleep(1000)
  await page.evaluate(async () => {
    let el = document.querySelector('compretend-audio')
    t.ok(el.audio.currentTime && el.audio.currentTime > 0)
    el.audio.currentTime = parseInt(el.audio.duration - 0.01)
    await sleep(2000)
    t.same(el.audio.ended, true)
  })
})
