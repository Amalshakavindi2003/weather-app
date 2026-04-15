import axios from 'axios'

export const API_KEY = import.meta.env.VITE_API_KEY

function normalizeApiMessage(message) {
  if (!message) {
    return ''
  }

  const normalizedMessage = message.toString().trim()

  if (!normalizedMessage) {
    return ''
  }

  const lowerMessage = normalizedMessage.toLowerCase()

  if (lowerMessage.includes('city not found')) {
    return 'Unable to find that city. Please check the spelling and try again.'
  }

  if (lowerMessage.includes('invalid api key')) {
    return 'The weather service rejected the API key. Please verify VITE_API_KEY in your .env file.'
  }

  if (lowerMessage.includes('too many requests')) {
    return 'The weather service is busy right now. Please try again in a moment.'
  }

  return normalizedMessage
}

export function requireApiKey() {
  if (!API_KEY) {
    throw new Error('Weather API key is missing. Add VITE_API_KEY to your .env file.')
  }

  return API_KEY
}

export function getFriendlyErrorMessage(error, fallbackMessage) {
  if (axios.isAxiosError(error)) {
    const apiMessage = error.response?.data?.message
    const normalizedApiMessage = normalizeApiMessage(apiMessage)

    if (normalizedApiMessage) {
      return normalizedApiMessage
    }

    if (error.code === 'ERR_NETWORK') {
      return 'Unable to reach the weather service. Check your connection and try again.'
    }
  }

  if (error instanceof Error && error.message) {
    return normalizeApiMessage(error.message)
  }

  return fallbackMessage
}