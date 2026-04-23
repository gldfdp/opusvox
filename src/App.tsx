import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { LanguageProvider } from '@/hooks/use-language'
import { AppRouter } from '@/components/AppRouter'
import { HomePage } from '@/pages/HomePage'

function App()
{
  return (
    <LanguageProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/app/*" element={<AppRouter />} />
        </Routes>
      </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
