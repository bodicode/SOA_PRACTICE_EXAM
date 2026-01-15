import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function translateAuthError(message: string): string {
  switch (message) {
    case 'Invalid login credentials':
      return 'Email hoặc mật khẩu không chính xác'
    case 'User already registered':
      return 'Email này đã được đăng ký'
    case 'Password should be at least 6 characters':
      return 'Mật khẩu phải có ít nhất 6 ký tự'
    case 'Email not confirmed':
      return 'Vui lòng xác thực email của bạn trước khi đăng nhập'
    default:
      return message
  }
}
