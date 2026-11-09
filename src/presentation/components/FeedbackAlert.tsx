import { Alert, type AlertColor } from '@mui/material'

export function FeedbackAlert({
  message,
  severity = 'info',
  onClose,
}: {
  message: string | null
  severity?: AlertColor
  onClose?: () => void
}) {
  if (!message) return null
  return (
    <Alert severity={severity} onClose={onClose} sx={{ borderRadius: 3 }}>
      {message}
    </Alert>
  )
}
