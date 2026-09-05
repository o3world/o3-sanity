/** Section story modules need an exported design reference; stress variants can inherit it. */
export default {
  meta: {
    type: 'problem',
    schema: [],
    messages: {
      missing:
        'Pair this section story module with Figma: add parameters.design: figmaDesign(nodeId) to its meta or an exported story.',
    },
  },
  create(context) {
    return {
      'Program:exit'(program) {
        const variables = new Map()
        const exports = []
        const names = new Set()
        for (const statement of program.body) {
          if (
            statement.type === 'ImportDeclaration' &&
            statement.source.value === '@o3/story-kit'
          ) {
            for (const specifier of statement.specifiers) {
              if (specifier.type === 'ImportSpecifier' && specifier.imported.name === 'figmaDesign')
                names.add(specifier.local.name)
            }
          }
          const declaration = statement.declaration ?? statement
          if (declaration.type === 'VariableDeclaration') {
            for (const variable of declaration.declarations) {
              if (variable.id.type === 'Identifier') variables.set(variable.id.name, variable.init)
              if (statement.type === 'ExportNamedDeclaration') exports.push(variable.init)
            }
          }
          if (statement.type === 'ExportDefaultDeclaration') exports.push(statement.declaration)
        }
        function unwrap(node, seen = new Set()) {
          if (!node || seen.has(node)) return null
          seen.add(node)
          if (node.type === 'Identifier') return unwrap(variables.get(node.name), seen)
          if (
            ['TSAsExpression', 'TSSatisfiesExpression', 'TSNonNullExpression'].includes(node.type)
          )
            return unwrap(node.expression, seen)
          return node
        }
        function property(node, name) {
          const object = unwrap(node)
          if (object?.type !== 'ObjectExpression') return null
          return object.properties.find(
            (prop) =>
              prop.type === 'Property' &&
              !prop.computed &&
              (prop.key.name ?? prop.key.value) === name,
          )?.value
        }
        const paired = exports.some((entry) => {
          const design = unwrap(property(property(entry, 'parameters'), 'design'))
          return (
            design?.type === 'CallExpression' &&
            names.has(design.callee.name) &&
            design.arguments[0]?.type === 'Literal' &&
            /^\d+[:-]\d+$/.test(design.arguments[0].value)
          )
        })
        if (!paired) context.report({ node: program, messageId: 'missing' })
      },
    }
  },
}
