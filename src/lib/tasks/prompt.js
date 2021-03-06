/**
 * Prompts for commonly used data. This task isn't necessary
 * needed, it's more of a convenience for asking questions up front,
 * instead of as files are generated. The actual messages for questions
 * can be found in the [common-questions][] library.
 *
 * ```sh
 * $ gen project:prompt
 * ```
 * @name project:prompt
 * @api public
 * @todo to use radio or other custom prompt:
 * @todo skip if answer exist in cache
 * @see https://github.com/enquirer/prompt-radio/issues/3
 */
export default app => {
  return done => {
    if (app.options.prompt === false) return done()

    app.base.data(app.cache.data)
    app.base.set('cache.prompted', true)

    // @todo skip if answer exist in cache
    // const skipCondition = app.option('hints') === false || app.option('skip') === false

    app.on('answer', function (response, key, question, answers) {
      // console.log({response, key, question, answers})
    })

    let name, defaultHost, files, authorName, keywords

    app.question('alias', {
      message: 'Generator alias ?',
      default: 'generator-example'
    })
    askPromise(['alias'])
    .then(({alias}) => {
      name = `generate-${alias}`

      !app.option('silent') && app.log.success(`Required package name is "${name}" (related to the generator alias)`)

      app.base.data({alias, name, packageName: name})

      app.question('name', {
        message: 'Package name (You should keep the suggestion or the generator may be broken) ?',
        default: name
      })
      app.question('dest', {
        message: 'Project directory ?',
        default: name
      })
      app.question('description', {
        message: 'Description ?',
        default: `${name} SWAP Generator`
      })
      app.choices('githosts', {
        message: 'Git host platform ?',
        choices: ['github.com', 'gitlab.sirap.fr', 'gitlab.com']
      })
      app.question('author.username', {
        message: 'Author username ?'
      })
      app.question('author.name', {
        message: 'Author name ?'
      })

      return askPromise(['name', 'dest', 'description', 'githosts', 'author.username', 'author.name'])
    })
    .then(answers => {
      const {githosts} = answers
      defaultHost = (githosts.length > 1) ? 'github.com' : githosts[0]
      const authorUsername = answers.author.username
      const defaultAuthorUrl = defaultHost === 'github.com'
        ? `https://github.com/${authorUsername}`
        : `https://gitlab.sirap.fr/${authorUsername}`

      app.base.data({defaultHost})
      app.base.data(answers)

      app.question('author.url', {
        message: 'Author URL ?',
        default: defaultAuthorUrl
      })
      app.question('author.twitter', {
        message: 'Twitter URL ?',
        default: `https://twitter.com/${authorUsername}`
      })
      app.question('owner', {
        message: `Owner (author or organisation) ?`,
        default: authorName
      })
      app.question('namespace', {
        message: 'Project namespace ?',
        default: answers.owner
      })

      return askPromise(['author.url', 'author.twitter', 'owner', 'namespace'])
    })
    .then(({owner, namespace}) => {
      app.base.data({owner, namespace})

      const defaultHomepage = defaultHost === 'github.com'
        ? `https://github.com/${namespace}/${name}`
        : `https://gitlab.sirap.fr/${namespace}/${name}`
      app.question('homepage', {
        message: 'Project homepage ?',
        default: defaultHomepage
      })

      const defaultIssues = defaultHost === 'github.com'
        ? `https://github.com/${namespace}/${name}/issues`
        : `https://gitlab.sirap.fr/${namespace}/${name}/issues`
      const defaultRepository = defaultHost === 'github.com'
        ? `git@github.com:${namespace}/${name}.git`
        : `git@gitlab.sirap.fr:${namespace}/${name}.git`

      app.question('issues', {
        message: 'Issues URL ?',
        default: defaultIssues
      })
      app.question('repository', {
        message: 'Repository URL ?',
        default: defaultRepository
      })
      app.question('version', {
        message: 'Version ?',
        default: '0.1.0'
      })
      app.question('license', {
        message: 'License ?',
        default: defaultHost === 'github.com' ? 'MIT' : 'UNLICENSED'
      })

      return askPromise([ 'homepage', 'issues', 'repository', 'version', 'license' ])
    })
    .then(answers => {
      app.base.data(answers)

      app.base.data({main: 'index.js'})
      !app.option('silent') && app.log.success('Required package main file is "index.js".')

      const defaultFiles = [
        'generator.js',
        'index.js',
        'LICENSE',
        'README.md',
        'dist/',
        'templates',
        'package.json',
        'yarn.lock'
      ]
      !app.option('silent') && app.log.success('Required packaged files are the following:', defaultFiles.join(','))

      files = defaultFiles

      app.question('additionnalFiles', {
        message: 'Additionnal files (comma separated) ?'
      })

      return askPromise('additionnalFiles')
    })
    .then(({additionnalFiles}) => {
      if (additionnalFiles && additionnalFiles.length) {
        additionnalFiles.split(',')
        .map(s => s.trim())
        .forEach(file => file && files.push(file))
      }

      app.base.data({files})

      const requiredKeywords = [
        'generate',
        'Generator',
        'generategenerator',
        'Generate Generator',
        'Node',
        'NodeJS',
        'ESNext',
        'Standard',
        'StandardJS',
        'Babel',
        'BabelJS',
        'npm',
        'yarn'
      ]

      keywords = requiredKeywords
      app.log.success('The required preset keywords are the following: ' + requiredKeywords.join(','))

      const suggestedKeywords = [
        'SWAP',
        'SWAP App',
        'SWAP Generator',
        'swap-project',
        'SWAP Project',
        'sirap',
        'sirap-group'
      ]

      app.choices('suggestedKeywords', {
        message: 'Suggested additionnal keywords ?',
        choices: suggestedKeywords
      })
      app.question('additionnalKeywords', {
        message: 'Additionnal keywords (comma separated) ?'
      })

      return askPromise(['suggestedKeywords', 'additionnalKeywords'])
    })
    .then(({suggestedKeywords, additionnalKeywords}) => {
      if (suggestedKeywords && suggestedKeywords.length) {
        suggestedKeywords
        .map(s => s.trim())
        .forEach(keyword => keyword && keywords.push(keyword))
      }
      if (additionnalKeywords && additionnalKeywords.length) {
        additionnalKeywords.split(',')
        .map(s => s.trim())
        .forEach(keyword => keyword && keywords.push(keyword))
      }

      app.base.data({keywords})
    })
    .then(() => done())
    .catch(err => done(err))
  }

  async function askPromise (keys) {
    return new Promise((resolve, reject) => {
      app.ask(keys, (err, answers) => {
        if (err) {
          reject(err)
        } else {
          resolve(answers)
        }
      })
    })
  }
}
