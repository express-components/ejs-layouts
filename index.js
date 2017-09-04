const fs = require('fs')
const path = require('path')
const ejs = require('ejs')

const rootDir = path.join(path.dirname(require.main.filename), 'layouts')

module.exports = function (filePath, options, callback) {
  fs.readFile(filePath, function (err, data) {
    if (err) throw err
    data = ejs.render(data.toString(), options)

    let vars = {}

    const varsRx = new RegExp(`<vars ([\\s\\S]*?)(><\\/vars>|\\/>)`, 'g')
    data.replace(varsRx, function (all, items) {
      items.replace(/(.*?)=(.*?)( |$|\n)/g, function (all, key, val) {
        if (val.substr(-1) === '"') {
          vars[key.trim()] = val.trim().slice(1, -1)
        } else {
          vars[key.trim()] = val.trim()
        }
      })
    })

    let injects = {
      leftovers: [data]
    }

    const insertRx = new RegExp(`<insert into="(.*?)">([\\s\\S]*?)</insert>`, 'g')
    data.replace(insertRx, function (all, where, content) {
      if (!injects[where]) injects[where] = []
      injects[where].push(content)
      injects.leftovers[0] = injects.leftovers[0].replace(all, '')
    })

    for (let key in injects) {
      injects[key] = injects[key].join('\n')
    }

    options = Object.assign(options, vars, injects)

    fs.readFile(path.join(rootDir, (options.template || 'default') + '.ejs'), function (err, data) {
      if (err) console.log(err)
      const finalHtml = ejs.render(data.toString(), options)

      callback(null, finalHtml)
    })
  })
}
