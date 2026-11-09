import { createTheme } from '@mui/material/styles'

export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: { main: '#2F6B4F', contrastText: '#FFFFFF' },
    secondary: { main: '#4F6356', contrastText: '#FFFFFF' },
    error: { main: '#BA1A1A' },
    background: { default: '#F6FBF4', paper: '#FFFFFF' },
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
    MuiCard: { styleOverrides: { root: { borderRadius: 28, border: '1px solid rgba(47,107,79,0.10)', boxShadow: '0 8px 30px rgba(20,50,35,0.06)' } } },
    MuiPaper: { styleOverrides: { rounded: { borderRadius: 28 } } },
    MuiDialog: { styleOverrides: { paper: { borderRadius: 28 } } },
    MuiChip: { styleOverrides: { root: { borderRadius: 999, fontWeight: 600 } } },
    MuiOutlinedInput: { styleOverrides: { root: { borderRadius: 16, backgroundColor: '#fff' } } },
    MuiDrawer: { styleOverrides: { paper: { borderRight: 'none' } } },
  },
})
