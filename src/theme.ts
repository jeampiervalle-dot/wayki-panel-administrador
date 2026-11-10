import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#7C6BC4', contrastText: '#FFFFFF' },
    secondary: { main: '#6B5A8E', contrastText: '#FFFFFF' },
    error: { main: '#BA1A1A' },
    background: { default: '#F6F3FC', paper: '#FFFFFF' },
    success: { main: '#2E7D32' },
    warning: { main: '#C77700' },
  },
  shape: { borderRadius: 20 },
  typography: {
    fontFamily: '"Roboto Flex", Roboto, system-ui, sans-serif',
    h3: { fontWeight: 750, letterSpacing: '-0.02em' },
    h4: { fontWeight: 720, letterSpacing: '-0.01em' },
    h5: { fontWeight: 700 },
    h6: { fontWeight: 650 },
    button: { textTransform: 'none', fontWeight: 650 },
  },
  components: {
    MuiButton: { styleOverrides: { root: { borderRadius: 999, paddingInline: 18, paddingBlock: 10 } } },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 28,
          border: '1px solid rgba(124,107,196,0.12)',
          boxShadow: '0 8px 30px rgba(76,58,140,0.08)',
        },
      },
    },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 28 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 28 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 600 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 16, backgroundColor: '#fff' } } },
    MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
  },
})
