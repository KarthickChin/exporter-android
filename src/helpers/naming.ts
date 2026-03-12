export function toCamelCase(name: string): string {
  const result = name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
  return result.charAt(0).toLowerCase() + result.slice(1)
}

export function toPascalCase(name: string): string {
  const result = name
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, char) => char.toUpperCase())
    .replace(/[^a-zA-Z0-9]/g, "")
  return result.charAt(0).toUpperCase() + result.slice(1)
}

export function safeTokenName(name: string): string {
  const first = name.charAt(0)
  if (first >= "0" && first <= "9") {
    return "_" + name
  }
  return name
}
