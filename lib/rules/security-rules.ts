import { BaseRule, type RuleContext } from "./base-rules";
import type { ParsedYAML } from "../types";

interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: "critical" | "high" | "medium" | "low";
  validator?: (match: string, context: string) => boolean;
}

interface DangerousPattern {
  pattern: RegExp;
  title: string;
  severity: "critical" | "high" | "medium" | "low";
  validator?: (match: string, context: string) => boolean;
}

export class HardcodedSecretsRule extends BaseRule {
  id = "hardcoded-secrets";
  name = "Hardcoded Secrets Detection";
  description = "Detects hardcoded secrets, API keys, passwords, and tokens";
  category = "security";
  severity = "critical" as const;
  level = "junior" as const;
  platforms = ["all"];

  private secretPatterns: SecretPattern[] = [
    // AWS - More specific patterns
    { 
      name: "AWS Access Key", 
      pattern: /AKIA[0-9A-Z]{16}/g, 
      severity: "critical",
      validator: (match: string) => !this.isPlaceholder(match)
    },
    { 
      name: "AWS Secret Key", 
      pattern: /aws_secret_access_key\s*[=:]\s*['"]?([A-Za-z0-9/+=]{40})['"]?/gi, 
      severity: "critical",
      validator: (match: string) => this.isValidAWSSecret(match)
    },
    { 
      name: "AWS Session Token", 
      pattern: /FwoGZXIvYXdzE[A-Za-z0-9/+=]{100,}/g, 
      severity: "critical" 
    },

    // GitHub Tokens - More precise
    { 
      name: "GitHub Token", 
      pattern: /gh[pasr]_[a-zA-Z0-9]{36,76}/g, 
      severity: "critical",
      validator: (match: string) => !this.isPlaceholder(match)
    },
    { 
      name: "GitHub Classic Token", 
      pattern: /ghp_[a-zA-Z0-9]{36}/g, 
      severity: "critical" 
    },

    // SSH Keys - More specific
    { 
      name: "SSH Private Key", 
      pattern: /-----BEGIN\s+(RSA\s+|EC\s+|DSA\s+|OPENSSH\s+)?PRIVATE\s+KEY-----/g, 
      severity: "critical" 
    },

    // Docker secrets
    { 
      name: "Docker ENV Secret", 
      pattern: /(ENV|ARG)\s+(AWS_SECRET|API_KEY|TOKEN|PASSWORD|SECRET)[^\n]*/gi, 
      severity: "high",
      validator: (match: string) => this.containsActualSecret(match)
    },

    // Generic secrets - More refined
    { 
      name: "Generic API Key", 
      pattern: /(api[_-]?key|apikey)\s*[=:]\s*['"]?([A-Za-z0-9\/_+=.-]{16,})['"]?/gi, 
      severity: "high",
      validator: (match: string) => this.isValidApiKey(match)
    },
    { 
      name: "Generic Password", 
      pattern: /(password|passwd|pwd)\s*[=:]\s*['"]?([A-Za-z0-9!@#$%^&*()_+=.-]{8,})['"]?/gi, 
      severity: "high",
      validator: (match: string) => this.isValidPassword(match)
    },
    { 
      name: "Generic Token", 
      pattern: /(token|auth[_-]?token)\s*[=:]\s*['"]?([A-Za-z0-9\/_+=.-]{20,})['"]?/gi, 
      severity: "high",
      validator: (match: string) => this.isValidToken(match)
    },

    // Bearer tokens
    { 
      name: "Bearer Token", 
      pattern: /Authorization:\s*Bearer\s+([A-Za-z0-9\-_.=]{20,})/gi, 
      severity: "high",
      validator: (match: string) => !this.isPlaceholder(match)
    },

    // Database connection strings
    { 
      name: "Database Connection String", 
      pattern: /(mongodb|mysql|postgres|postgresql):\/\/[^:\s]+:[^@\s]+@[^\s]+/gi, 
      severity: "high",
      validator: (match: string) => this.isValidConnectionString(match)
    },

    // JWT tokens
    { 
      name: "JWT Token", 
      pattern: /eyJ[A-Za-z0-9_-]+\.eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g, 
      severity: "medium",
      validator: (match: string) => this.isValidJWT(match)
    },

    // Google API keys
    { 
      name: "Google API Key", 
      pattern: /AIza[0-9A-Za-z_-]{35}/g, 
      severity: "high" 
    },

    // Slack tokens
    { 
      name: "Slack Token", 
      pattern: /xox[baprs]-[0-9]{12}-[0-9]{12}-[0-9a-zA-Z]{24}/g, 
      severity: "high" 
    },

    // Stripe keys
    { 
      name: "Stripe Key", 
      pattern: /(sk|pk)_(test|live)_[0-9a-zA-Z]{24}/g, 
      severity: "high" 
    }
  ];

  check(parsed: ParsedYAML, context: RuleContext): void {
    const lines = context.rawContent.split("\n");

    this.secretPatterns.forEach(({ name, pattern, severity, validator }) => {
      lines.forEach((line, index) => {
        // Skip comments and environment variable references
        if (line.trim().startsWith("#") || this.isEnvironmentVariableReference(line)) return;
        
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            // Apply additional validation if provided
            if (validator && !validator(match, line)) return;
            
            if (this.isLikelySecret(match)) {
              context.addSecurityVulnerability({
                title: `Exposed ${name}`,
                description: `Potential ${name.toLowerCase()} found: "${this.maskSecret(match)}"`,
                severity,
                recommendation: this.getRecommendation(name),
                line: index + 1,
              });
            }
          });
        }
      });
    });
  }

  private isEnvironmentVariableReference(line: string): boolean {
    return line.includes("$") && (line.includes("${") || line.includes("${{") || line.includes("$"));
  }

  private isLikelySecret(value: string): boolean {
    const falsePositives = [
      "example", "test", "placeholder", "your_", "dummy", "fake", 
      "sample", "demo", "mock", "template", "xxx", "yyy", "zzz",
      "changeme", "replace", "todo", "fixme", "tbd", "null", "undefined",
      "default", "config", "setting", "value", "data", "info"
    ];
    const lowerValue = value.toLowerCase();
    return !falsePositives.some((fp) => lowerValue.includes(fp));
  }

  private isPlaceholder(value: string): boolean {
    const placeholderPatterns = [
      /^[x]{8,}$/i,           // All x's
      /^[0]{8,}$/,            // All zeros
      /^[1]{8,}$/,            // All ones
      /^(your|my|the)[_-]/i,  // your_, my_, the_
      /placeholder/i,
      /example/i,
      /test/i,
      /demo/i,
      /sample/i
    ];
    return placeholderPatterns.some(pattern => pattern.test(value));
  }

  private isValidAWSSecret(match: string): boolean {
    const secretMatch = match.match(/([A-Za-z0-9/+=]{40})/);
    if (!secretMatch) return false;
    
    const secret = secretMatch[1];
    // AWS secrets should have good entropy and not be obvious placeholders
    return this.hasGoodEntropy(secret) && !this.isPlaceholder(secret);
  }

  private isValidApiKey(match: string): boolean {
    const keyMatch = match.match(/([A-Za-z0-9\/_+=.-]{16,})/);
    if (!keyMatch) return false;
    
    const key = keyMatch[1];
    return this.hasGoodEntropy(key) && !this.isPlaceholder(key);
  }

  private isValidPassword(match: string): boolean {
    const passwordMatch = match.match(/([A-Za-z0-9!@#$%^&*()_+=.-]{8,})/);
    if (!passwordMatch) return false;
    
    const password = passwordMatch[1];
    // Don't flag obvious non-passwords
    const obviousNonPasswords = ["password", "123456", "admin", "user", "guest", "root"];
    return !obviousNonPasswords.includes(password.toLowerCase()) && !this.isPlaceholder(password);
  }

  private isValidToken(match: string): boolean {
    const tokenMatch = match.match(/([A-Za-z0-9\/_+=.-]{20,})/);
    if (!tokenMatch) return false;
    
    const token = tokenMatch[1];
    return this.hasGoodEntropy(token) && !this.isPlaceholder(token);
  }

  private isValidConnectionString(match: string): boolean {
    // Don't flag connection strings with obvious placeholders
    const placeholders = ["username", "password", "user", "pass", "localhost", "example.com"];
    return !placeholders.some(placeholder => match.toLowerCase().includes(placeholder));
  }

  private isValidJWT(match: string): boolean {
    // Basic JWT structure validation
    const parts = match.split('.');
    if (parts.length !== 3) return false;
    
    try {
      // Try to decode the header to see if it's a real JWT
      const header = JSON.parse(atob(parts[0]));
      return header.typ === 'JWT' || header.alg;
    } catch {
      return false;
    }
  }

  private containsActualSecret(match: string): boolean {
    // Check if the Docker ENV/ARG actually contains a secret value
    const secretValue = match.split(/[=\s]/).pop()?.trim();
    return secretValue ? this.isLikelySecret(secretValue) && !this.isPlaceholder(secretValue) : false;
  }

  private hasGoodEntropy(value: string): boolean {
    if (value.length < 8) return false;
    
    // Check for character diversity
    const hasLower = /[a-z]/.test(value);
    const hasUpper = /[A-Z]/.test(value);
    const hasDigit = /\d/.test(value);
    const hasSpecial = /[+/=_-]/.test(value);
    
    const charTypes = [hasLower, hasUpper, hasDigit, hasSpecial].filter(Boolean).length;
    return charTypes >= 2;
  }

  private getRecommendation(secretType: string): string {
    const recommendations: Record<string, string> = {
      "AWS Access Key": "Use IAM roles or AWS credentials file with proper permissions",
      "GitHub Token": "Use GitHub secrets or environment variables in CI/CD",
      "Database Connection String": "Use environment variables or secret management services",
      "JWT Token": "Generate tokens at runtime, never hardcode them",
      "Generic API Key": "Store in environment variables or secure vault",
      "Generic Password": "Use environment variables or secure password management",
      "Generic Token": "Use environment variables or secure token storage"
    };
    
    return recommendations[secretType] || "Use environment variables or secret management systems";
  }

  private maskSecret(secret: string): string {
    if (secret.length <= 8) return "*".repeat(secret.length);
    return secret.substring(0, 4) + "*".repeat(secret.length - 8) + secret.substring(secret.length - 4);
  }
}

export class PermissionsRule extends BaseRule {
  id = "permissions";
  name = "File Permissions Detection";
  description = "Detects insecure file permissions and ownership issues";
  category = "security";
  severity = "warning" as const;
  level = "beginner" as const;
  platforms = ["all"];

  private permissionPatterns: DangerousPattern[] = [
    {
      pattern: /chmod\s+(777|666|755|644|700|600|755|644)\s+/g,
      title: "File permissions",
      severity: "medium",
      validator: (match: string) => this.isInsecurePermission(match)
    },
    {
      pattern: /chown\s+(root|0)\s+/g,
      title: "Root ownership",
      severity: "high",
      validator: (match: string) => this.isProblematicOwnership(match)
    },
    {
      pattern: /umask\s+0{3}/g,
      title: "Permissive umask",
      severity: "high"
    },
    {
      pattern: /find\s+[^|]*-perm\s+777/g,
      title: "Finding world-writable files",
      severity: "medium"
    },
    {
      pattern: /setuid|setgid/g,
      title: "SUID/SGID usage",
      severity: "high"
    },
    {
      pattern: /sudo\s+chmod\s+\+s/g,
      title: "Adding SUID bit",
      severity: "critical"
    }
  ];

  check(parsed: ParsedYAML, context: RuleContext): void {
    const lines = context.rawContent.split("\n");
    
    this.permissionPatterns.forEach(({ pattern, title, severity, validator }) => {
      lines.forEach((line, index) => {
        if (line.trim().startsWith("#")) return;
        
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            if (validator && !validator(match, line)) return;
            
            context.addSecurityVulnerability({
              title: `Insecure ${title}`,
              description: `Permission issue found: "${line.trim()}"`,
              severity,
              recommendation: this.getPermissionRecommendation(title),
              line: index + 1,
            });
          });
        }
      });
    });
  }

  private isInsecurePermission(match: string): boolean {
    // 777 and 666 are always insecure
    if (match.includes('777') || match.includes('666')) return true;
    
    // 755 might be okay for executables, but flag for review
    if (match.includes('755')) return true;
    
    // Other permissions are generally safer
    return false;
  }

  private isProblematicOwnership(match: string): boolean {
    // Changing ownership to root in user scripts is often problematic
    return match.includes('root') || match.includes(' 0 ');
  }

  private getPermissionRecommendation(permissionType: string): string {
    const recommendations: Record<string, string> = {
      "File permissions": "Use least privilege principle: 644 for files, 755 for directories",
      "Root ownership": "Avoid changing ownership to root unless absolutely necessary",
      "Permissive umask": "Use more restrictive umask like 022 or 077",
      "Finding world-writable files": "Review and fix world-writable files found",
      "SUID/SGID usage": "Avoid SUID/SGID unless absolutely necessary for security",
      "Adding SUID bit": "SUID binaries are security risks; use alternatives if possible"
    };
    
    return recommendations[permissionType] || "Review file permissions for security implications";
  }
}

export class DangerousCommandsRule extends BaseRule {
  id = "dangerous-commands";
  name = "Dangerous Commands Detection";
  description = "Detects potentially dangerous shell commands and practices";
  category = "security";
  severity = "error" as const;
  level = "intermediate" as const;
  platforms = ["all"];

  private dangerousPatterns: DangerousPattern[] = [
    { 
      pattern: /rm\s+-rf\s+(\/[^\s]|\$HOME|~|\.\.|\*)/g, 
      title: "Recursive delete", 
      severity: "critical",
      validator: (match: string) => !this.isSafeDelete(match)
    },
    { 
      pattern: /chmod\s+(777|666|755)\s+/g, 
      title: "Permissive permissions", 
      severity: "high",
      validator: (match: string) => this.isActuallyDangerous(match)
    },
    { 
      pattern: /eval\s+[\$`]/g, 
      title: "Eval with command substitution", 
      severity: "high" 
    },
    { 
      pattern: /(curl|wget)\s+[^|]*\|\s*(sh|bash|python|ruby|perl)/g, 
      title: "Remote script execution", 
      severity: "critical",
      validator: (match: string) => !this.isTrustedSource(match)
    },
    { 
      pattern: /sudo\s+(rm|chmod|chown|mv|cp|dd)\s+\/[^\s]/g, 
      title: "Sudo on system paths", 
      severity: "high",
      validator: (match: string) => this.isSystemPath(match)
    },
    { 
      pattern: /docker\s+run[^|]*--privileged/g, 
      title: "Privileged container", 
      severity: "high" 
    },
    { 
      pattern: /printenv|env\s*$/g, 
      title: "Environment dump", 
      severity: "medium" 
    },
    { 
      pattern: /echo\s+\$[A-Z_]+/g, 
      title: "Echo environment variable", 
      severity: "medium",
      validator: (match: string) => this.isSecretEnvVar(match)
    },
    { 
      pattern: /ssh\s+root@[^\s]+/g, 
      title: "SSH as root", 
      severity: "critical",
      validator: (match: string) => !this.isLocalhost(match)
    },
    { 
      pattern: /aws\s+configure\s+set\s+(aws_access_key_id|aws_secret_access_key)\s+[^\s]+/g, 
      title: "AWS CLI hardcoded credentials", 
      severity: "high",
      validator: (match: string) => !this.isVariableReference(match)
    },
    { 
      pattern: />\s*\/dev\/null\s+2>&1/g, 
      title: "Suppressed error output", 
      severity: "medium" 
    },
    { 
      pattern: /mktemp.*\|\s*(sh|bash)/g, 
      title: "Temporary file execution", 
      severity: "high" 
    },
    { 
      pattern: /nc\s+(-l\s+)?-e\s+/g, 
      title: "Netcat reverse shell", 
      severity: "critical" 
    },
    { 
      pattern: /python\s+-c\s+['"]import\s+os.*shell/g, 
      title: "Python shell command", 
      severity: "high" 
    },
    { 
      pattern: /find\s+\/.*-exec\s+rm/g, 
      title: "Find and delete", 
      severity: "high" 
    },
    { 
      pattern: /history\s+-c/g, 
      title: "Clear command history", 
      severity: "medium" 
    }
  ];

  check(parsed: ParsedYAML, context: RuleContext): void {
    const lines = context.rawContent.split("\n");
    
    this.dangerousPatterns.forEach(({ pattern, title, severity, validator }) => {
      lines.forEach((line, index) => {
        // Skip comments
        if (line.trim().startsWith("#")) return;
        
        const matches = line.match(pattern);
        if (matches) {
          matches.forEach((match) => {
            // Apply additional validation if provided
            if (validator && !validator(match, line)) return;
            
            context.addSecurityVulnerability({
              title,
              description: `Dangerous command found: "${line.trim()}"`,
              severity,
              recommendation: this.getRecommendation(title),
              line: index + 1,
            });
          });
        }
      });
    });
  }

  private isSafeDelete(match: string): boolean {
    // Check if it's deleting safe paths like temp directories
    const safePaths = ['/tmp/', '/var/tmp/', './build', './dist', './node_modules'];
    return safePaths.some(path => match.includes(path));
  }

  private isActuallyDangerous(match: string): boolean {
    // 755 is often legitimate, focus on 777 and 666
    return match.includes('777') || match.includes('666');
  }

  private isTrustedSource(match: string): boolean {
    // Check if downloading from trusted sources
    const trustedDomains = ['github.com', 'githubusercontent.com', 'docker.com', 'microsoft.com'];
    return trustedDomains.some(domain => match.includes(domain));
  }

  private isSystemPath(match: string): boolean {
    // Check if operating on critical system paths
    const systemPaths = ['/bin/', '/sbin/', '/usr/bin/', '/usr/sbin/', '/etc/', '/boot/', '/sys/', '/proc/'];
    return systemPaths.some(path => match.includes(path));
  }

  private isSecretEnvVar(match: string): boolean {
    // Check if echoing potentially sensitive environment variables
    const secretVars = ['PASSWORD', 'SECRET', 'TOKEN', 'KEY', 'AUTH', 'CREDENTIAL', 'PRIVATE'];
    const envVar = match.match(/\$([A-Z_]+)/)?.[1];
    return envVar ? secretVars.some(secret => envVar.includes(secret)) : false;
  }

  private isLocalhost(match: string): boolean {
    // Check if SSH is to localhost (might be legitimate for testing)
    return match.includes('localhost') || match.includes('127.0.0.1') || match.includes('::1');
  }

  private isVariableReference(match: string): boolean {
    // Check if the credential is actually a variable reference
    return match.includes('$') || match.includes('${') || match.includes('${{');
  }

  private getRecommendation(commandType: string): string {
    const recommendations: Record<string, string> = {
      "Recursive delete": "Use specific paths and consider using safer alternatives like trash commands",
      "Permissive permissions": "Use more restrictive permissions (e.g., 644 for files, 755 for directories)",
      "Eval with command substitution": "Avoid eval with dynamic input; use safer alternatives",
      "Remote script execution": "Download, verify, and then execute scripts separately",
      "Sudo on system paths": "Avoid modifying system paths; use package managers when possible",
      "Privileged container": "Use specific capabilities instead of --privileged when possible",
      "Environment dump": "Avoid exposing all environment variables; use specific variable access",
      "Echo environment variable": "Avoid echoing sensitive environment variables",
      "SSH as root": "Use sudo or specific user accounts instead of root SSH",
      "AWS CLI hardcoded credentials": "Use AWS credential files, IAM roles, or environment variables",
      "Suppressed error output": "Consider logging errors instead of suppressing them",
      "Temporary file execution": "Validate and sanitize temporary file contents",
      "Netcat reverse shell": "Use legitimate remote access tools instead of netcat shells",
      "Python shell command": "Use Python's subprocess module safely instead of shell commands",
      "Find and delete": "Use more specific find criteria and consider dry-run first",
      "Clear command history": "Consider why command history needs to be cleared"
    };
    
    return recommendations[commandType] || "Review and sanitize this command for security implications";
  }
}