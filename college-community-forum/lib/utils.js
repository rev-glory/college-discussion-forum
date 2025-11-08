import { clsx } from "clsx"
import { twMerge } from "tailwind-merge"

/**
 * Merge Tailwind CSS classes
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

/**
 * Create standard API response
 */
export function apiResponse(success, data = null, message = '', status = 200) {
  return new Response(
    JSON.stringify({
      success,
      data,
      message,
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create error API response
 */
export function apiError(message, status = 400) {
  return apiResponse(false, null, message, status);
}

/**
 * Validate email format
 */
export function isValidEmail(email) {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
}

/**
 * Sanitize user input
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim().replace(/[<>]/g, '');
}

/**
 * Format date for display
 */
export function formatDate(date) {
  const d = new Date(date);
  const now = new Date();
  const diff = now - d;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 7) {
    return d.toLocaleDateString();
  } else if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else if (minutes > 0) {
    return `${minutes}m ago`;
  } else {
    return 'Just now';
  }
}
