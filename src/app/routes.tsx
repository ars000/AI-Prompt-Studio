import { createBrowserRouter } from 'react-router-dom'
import { Layout } from './Layout'
import { LibraryPage } from '../features/library/LibraryPage'
import { CollectionsPage } from '../features/library/CollectionsPage'
import { PromptEditorPage } from '../features/prompts/PromptEditorPage'
import { ImportExportPage } from '../features/import-export/ImportExportPage'
import { SettingsPage } from '../features/settings/SettingsPage'
import { GuidePage } from '../features/guide/GuidePage'
import { OptimizerPage } from '../features/optimizer/OptimizerPage'
import { NotFoundPage } from './NotFoundPage'

const basename =
  import.meta.env.BASE_URL === '/' ? undefined : import.meta.env.BASE_URL.replace(/\/$/, '')

export const router = createBrowserRouter(
  [
    {
      path: '/',
      element: <Layout />,
      children: [
        { index: true, element: <LibraryPage /> },
        { path: 'optimizer', element: <OptimizerPage /> },
        { path: 'collections', element: <CollectionsPage /> },
        { path: 'prompts/:id', element: <PromptEditorPage /> },
        { path: 'import-export', element: <ImportExportPage /> },
        { path: 'settings', element: <SettingsPage /> },
        { path: 'guide', element: <GuidePage /> },
        { path: '*', element: <NotFoundPage /> },
      ],
    },
  ],
  { basename },
)
