import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import yaml from "js-yaml" // Import js-yaml

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// New utility function for robust YAML parsing
export function parseYAML(content: string): any {
  try {
    return yaml.load(content)
  } catch (error: any) {
    // Re-throw with more context if it's a YAML parsing error
    if (error.name === "YAMLException") {
      throw new Error(
        `YAML parsing error: ${error.message}${error.mark ? ` at line ${error.mark.line + 1}, column ${error.mark.column + 1}` : ""}`,
      )
    }
    throw error // Re-throw other errors as-is
  }
}
