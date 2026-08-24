const enabled = Boolean(process.stdout.isTTY) && !process.env.NO_COLOR;

export function paint(value: string, code: string): string {
  return enabled ? `\u001b[${code}m${value}\u001b[0m` : value;
}

export function heading(value: string): string {
  return paint(value, "1;37");
}

export function success(value: string): string {
  return paint(value, "32");
}

export function warning(value: string): string {
  return paint(value, "33");
}

export function error(value: string): string {
  return paint(value, "31");
}

export function info(value: string): string {
  return paint(value, "36");
}

export function label(value: string): string {
  return paint(value, "1;37");
}

export function muted(value: string): string {
  return paint(value, "2");
}
