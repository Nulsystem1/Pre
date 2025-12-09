// JSON Logic implementation for control evaluation
// This is a simplified version - in production, use json-logic-js package

import type { JSONLogicCondition } from "./types"

type LogicData = Record<string, unknown>

function getVar(path: string, data: LogicData): unknown {
  const parts = path.split(".")
  let current: unknown = data
  for (const part of parts) {
    if (current === null || current === undefined) return undefined
    current = (current as Record<string, unknown>)[part]
  }
  return current
}

function resolveValue(value: unknown, data: LogicData): unknown {
  if (value && typeof value === "object" && "var" in value) {
    return getVar((value as { var: string }).var, data)
  }
  return value
}

export function evaluateCondition(condition: JSONLogicCondition, data: LogicData): boolean {
  // Handle AND
  if ("and" in condition && Array.isArray(condition.and)) {
    return condition.and.every((c) => evaluateCondition(c as JSONLogicCondition, data))
  }

  // Handle OR
  if ("or" in condition && Array.isArray(condition.or)) {
    return condition.or.some((c) => evaluateCondition(c as JSONLogicCondition, data))
  }

  // Handle ==
  if ("==" in condition && Array.isArray(condition["=="])) {
    const [a, b] = condition["=="]
    return resolveValue(a, data) === resolveValue(b, data)
  }

  // Handle !=
  if ("!=" in condition && Array.isArray(condition["!="])) {
    const [a, b] = condition["!="]
    return resolveValue(a, data) !== resolveValue(b, data)
  }

  // Handle >
  if (">" in condition && Array.isArray(condition[">"])) {
    const [a, b] = condition[">"]
    const aVal = resolveValue(a, data) as number
    const bVal = resolveValue(b, data) as number
    return aVal > bVal
  }

  // Handle >=
  if (">=" in condition && Array.isArray(condition[">="])) {
    const [a, b] = condition[">="]
    const aVal = resolveValue(a, data) as number
    const bVal = resolveValue(b, data) as number
    return aVal >= bVal
  }

  // Handle <
  if ("<" in condition && Array.isArray(condition["<"])) {
    const [a, b] = condition["<"]
    const aVal = resolveValue(a, data) as number
    const bVal = resolveValue(b, data) as number
    return aVal < bVal
  }

  // Handle <=
  if ("<=" in condition && Array.isArray(condition["<="])) {
    const [a, b] = condition["<="]
    const aVal = resolveValue(a, data) as number
    const bVal = resolveValue(b, data) as number
    return aVal <= bVal
  }

  // Handle in
  if ("in" in condition && Array.isArray(condition.in)) {
    const [value, array] = condition.in
    const resolvedValue = resolveValue(value, data)
    const resolvedArray = resolveValue(array, data) as unknown[]
    return Array.isArray(resolvedArray) && resolvedArray.includes(resolvedValue)
  }

  return false
}

// Match conditions and return which parts matched
export function matchConditions(
  condition: JSONLogicCondition,
  data: LogicData,
): { matched: boolean; details: Record<string, unknown> } {
  const details: Record<string, unknown> = {}

  const matched = evaluateCondition(condition, data)

  // Extract variable comparisons for audit
  const extractVars = (cond: JSONLogicCondition) => {
    for (const [op, value] of Object.entries(cond)) {
      if (op === "and" || op === "or") {
        ;(value as JSONLogicCondition[]).forEach(extractVars)
      } else if (Array.isArray(value) && value.length >= 2) {
        const [a, b] = value
        if (a && typeof a === "object" && "var" in a) {
          const varPath = (a as { var: string }).var
          const actualValue = getVar(varPath, data)
          details[varPath] = { expected: b, actual: actualValue, matched: actualValue === b }
        }
      }
    }
  }

  extractVars(condition)

  return { matched, details }
}
