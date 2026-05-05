type AnyObject = Record<string, any>

export const toSnake = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toSnake)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: AnyObject, key) => {
      const snakeKey = key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`)
      acc[snakeKey] = toSnake(obj[key])
      return acc
    }, {})
  }
  return obj
}

export const toCamel = (obj: any): any => {
  if (Array.isArray(obj)) return obj.map(toCamel)
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((acc: AnyObject, key) => {
      const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase())
      acc[camelKey] = toCamel(obj[key])
      return acc
    }, {})
  }
  return obj
}