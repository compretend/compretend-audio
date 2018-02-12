const path = require('path')
const cappadonna = require('cappadonna')
const test = cappadonna(path.join(__dirname, 'components.js'))

test('basic file', async (page, t) => {
  t.plan(1)
  await page.evaluate(async () => {
    document.body.innerHTML += `
    <compretend-audio
      account="x9UAnPSQPxeeEcXeiYPysOfco3T2"
      filename="alex-russell-short.mp3">
    </compretend-audio>
    `
    await document.querySelector('compretend-audio').nextRender()
    let el = document.querySelector('compretend-audio')
    t.same(el.filename, 'alex-russell-short.mp3')
  })
})
