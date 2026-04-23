import { LanguageProvider } from '@/hooks/use-language'
import { AppRouter } from '@/components/AppRouter'

function App()
{
  return (
    <LanguageProvider>
      <AppRouter />
    </LanguageProvider>
  )
}

export default App
