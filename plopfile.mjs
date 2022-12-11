export default function (
  /** @type {import('plop').NodePlopAPI} */
  plop
) {
  plop.setGenerator('testcase', {
    description: 'create a test case project',
    prompts: [
      {
        type: 'input',
        name: 'name',
        message: 'test case project name'
      }
    ],
    actions: [
      {
        type: 'addMany',
        base: 'plops/testcase',
        templateFiles: 'plops/testcase/**/*',
        destination: 'testcases/{{name}}',
      },
      {
        type: 'add',
        path: 'testcases/{{name}}/.gitignore',
        templateFile: 'plops/testcase/.gitignore',
      },
    ]
  })
}
