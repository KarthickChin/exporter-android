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

export function toSnakeCase(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .replace(/[^a-zA-Z0-9]+/g, "_")
    .toLowerCase()
}

export function toLowerCased(name: string): string {
  return toCamelCase(name).toLowerCase()
}

export function safeTokenName(name: string): string {
  const first = name.charAt(0)
  if (first >= "0" && first <= "9") {
    return "_" + name
  }
  return name
}

export function formatTokenName(name: string, caseStyle: "camel" | "pascal" | "snake" | "lower"): string {
  let converted: string
  switch (caseStyle) {
    case "camel":
      converted = toCamelCase(name)
      break
    case "pascal":
      converted = toPascalCase(name)
      break
    case "snake":
      converted = toSnakeCase(name)
      break
    case "lower":
      converted = toLowerCased(name)
      break
  }
  return safeTokenName(converted)
}
