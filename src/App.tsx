import { Routes, Route } from 'react-router-dom'
import { IndexPage } from '@/pages/IndexPage'
import { CanvasPage } from '@/pages/canvas/CanvasPage'
import { ReferencePage } from '@/pages/reference/ReferencePage'
import { DemoPage } from '@/pages/demo/DemoPage'
import { SlackbotTemplatesPage } from '@/pages/slackbot-templates/SlackbotTemplatesPage'
import { FoundationDesignSystemPage } from '@/pages/design-system/FoundationDesignSystemPage'
import { ViewHeadersDesignPage } from '@/pages/view-headers/ViewHeadersDesignPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<IndexPage />} />
      <Route path="/canvas" element={<CanvasPage />} />
      <Route path="/reference" element={<ReferencePage />} />
      <Route path="/slackbot-templates" element={<SlackbotTemplatesPage />} />
      <Route path="/design-system" element={<FoundationDesignSystemPage />} />
      <Route path="/view-headers" element={<ViewHeadersDesignPage />} />
      <Route path="/demo/:storyId/:personaId" element={<DemoPage />} />
      <Route path="/demo/:storyId" element={<DemoPage />} />
    </Routes>
  )
}

export default App
