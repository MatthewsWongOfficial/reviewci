// Simple YAML parser implementation to replace js-yaml
export class SimpleYamlParser {
  static parse(content: string): any {
    try {
      // Remove comments and empty lines
      const lines = content
        .split('\n')
        .map(line => line.replace(/#.*$/, '').trimEnd())
        .filter(line => line.trim() !== '')

      const result: any = {}
      const stack: Array<{ obj: any; indent: number }> = [{ obj: result, indent: -1 }]
      
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i]
        const indent = line.length - line.trimStart().length
        const trimmed = line.trim()
        
        if (!trimmed) continue
        
        // Pop stack until we find the right parent
        while (stack.length > 1 && stack[stack.length - 1].indent >= indent) {
          stack.pop()
        }
        
        const parent = stack[stack.length - 1].obj
        
        if (trimmed.includes(':')) {
          const colonIndex = trimmed.indexOf(':')
          const key = trimmed.substring(0, colonIndex).trim()
          const value = trimmed.substring(colonIndex + 1).trim()
          
          if (value === '') {
            // Object or array
            const nextLine = i + 1 < lines.length ? lines[i + 1] : ''
            const nextIndent = nextLine.length - nextLine.trimStart().length
            
            if (nextLine.trim().startsWith('-')) {
              // Array
              parent[key] = []
              stack.push({ obj: parent[key], indent })
            } else if (nextIndent > indent) {
              // Object
              parent[key] = {}
              stack.push({ obj: parent[key], indent })
            } else {
              parent[key] = null
            }
          } else {
            // Simple value
            parent[key] = this.parseValue(value)
          }
        } else if (trimmed.startsWith('-')) {
          // Array item
          const value = trimmed.substring(1).trim()
          if (!Array.isArray(parent)) {
            throw new Error(`Expected array but found object at line ${i + 1}`)
          }
          
          if (value.includes(':')) {
            // Object in array
            const obj: any = {}
            parent.push(obj)
            stack.push({ obj, indent })
            
            const colonIndex = value.indexOf(':')
            const key = value.substring(0, colonIndex).trim()
            const val = value.substring(colonIndex + 1).trim()
            obj[key] = val === '' ? null : this.parseValue(val)
          } else {
            parent.push(this.parseValue(value))
          }
        }
      }
      
      return result
    } catch (error) {
      throw new Error(`YAML parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
  
  private static parseValue(value: string): any {
    // Handle quoted strings
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      return value.slice(1, -1)
    }
    
    // Handle booleans
    if (value === 'true') return true
    if (value === 'false') return false
    
    // Handle null/undefined
    if (value === 'null' || value === '~' || value === '') return null
    
    // Handle numbers
    if (/^-?\d+$/.test(value)) return parseInt(value, 10)
    if (/^-?\d*\.\d+$/.test(value)) return parseFloat(value)
    
    // Handle arrays in single line
    if (value.startsWith('[') && value.endsWith(']')) {
      const items = value.slice(1, -1).split(',').map(item => item.trim())
      return items.map(item => this.parseValue(item))
    }
    
    // Return as string
    return value
  }
}
